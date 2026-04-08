import { readFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { runAgent } from "./run-agent.js";
import { archiveOutput } from "./archive.js";
import {
  PLANNER_SYSTEM_PROMPT,
  buildPlannerPrompt,
} from "./prompts/planner.js";
import {
  QA_EVALUATOR_SYSTEM_PROMPT,
  buildQAEvaluatorPrompt,
} from "./prompts/qa-evaluator.js";
import type {
  ProductSpec,
  QAEvaluation,
  LoopSummary,
} from "./types.js";

/**
 * V2 ハーネス: スプリントレス連続ビルド
 *
 * Opus 4.6 のコンテキスト安定性を活用し、スプリント分割なしで
 * アプリ全体を一度にビルドする。QA評価は最後に1回のみ。
 */

export interface ContinuousLoopConfig {
  maxBuildRetries: number; // ビルド→QA のリトライ上限
  passThreshold: number;
  model?: string;
  outputDir: string;
  generatorMaxTurns: number; // 連続ビルドのmaxTurns（大きめに設定）
}

export const DEFAULT_CONTINUOUS_CONFIG: ContinuousLoopConfig = {
  maxBuildRetries: 3,
  passThreshold: 7.0,
  outputDir: "output",
  generatorMaxTurns: 100,
};

const CONTINUOUS_GENERATOR_SYSTEM_PROMPT = `あなたはフルスタックエンジニアです。
仕様書に基づいてアプリケーション全体を一度のセッションで構築します。

## 作業ルール

1. 仕様書の全機能を実装すること（スプリント分割なし、全て一度に構築）
2. まず全体の設計計画を立て、実装順序を決めてから着手すること
3. 各機能を実装した後、動作確認のためにビルドを試みること
4. 全機能の実装が完了したら、自己評価を実施し、明らかなバグは自分で修正すること
5. 最後にgitでコミットすること

## 技術ガイドライン

- プロジェクト全体の構造を最初に設計する
- 型安全性を確保する
- エラーハンドリングを適切に行う
- コンポーネント分割を意識する
- 一貫したデザイン言語を仕様のdesignLanguageに従って適用する

## AI機能の実装パターン

仕様にAI機能が含まれている場合、以下のパターンで実装すること：

### バックエンド（APIプロキシ）
\`\`\`typescript
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();

app.post("/api/ai/generate", async (req, res) => {
  const { prompt, context } = req.body;
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  res.json({ result: message.content[0].text });
});
\`\`\`

### 注意点
- APIキーはフロントエンドに直接埋め込まないこと
- AI呼び出しにはローディング状態を表示すること
- エラー時のフォールバックを用意すること
`;

export async function runContinuousLoop(
  userPrompt: string,
  config: Partial<ContinuousLoopConfig> = {}
): Promise<LoopSummary> {
  const cfg = {
    ...DEFAULT_CONTINUOUS_CONFIG,
    ...Object.fromEntries(
      Object.entries(config).filter(([, v]) => v !== undefined)
    ),
  } as ContinuousLoopConfig;
  const baseDir = path.resolve(cfg.outputDir, "continuous");
  archiveOutput(baseDir, "continuous");
  const projectDir = path.join(baseDir, "app");
  mkdirSync(projectDir, { recursive: true });

  let totalCost = 0;

  console.log("=".repeat(60));
  console.log("V2 Continuous Loop 開始（スプリントレス）");
  console.log(`プロンプト: ${userPrompt}`);
  console.log(`ビルドリトライ上限: ${cfg.maxBuildRetries}`);
  console.log(`合格閾値: ${cfg.passThreshold}`);
  console.log(`Generator maxTurns: ${cfg.generatorMaxTurns}`);
  console.log("=".repeat(60));

  // ── Phase 1: Planner ──
  console.log("\n📋 Planner Agent 実行中...");
  const specMdPath = path.join(baseDir, "spec.md");
  const specJsonPath = path.join(baseDir, "spec.json");

  const plannerPrompt = buildPlannerPrompt(
    userPrompt,
    specMdPath,
    specJsonPath
  );

  const planResult = await runAgent(plannerPrompt, {
    systemPrompt: PLANNER_SYSTEM_PROMPT,
    allowedTools: ["Write"],
    permissionMode: "acceptEdits",
    maxTurns: 10,
    cwd: baseDir,
    model: cfg.model,
  });
  totalCost += planResult.cost ?? 0;

  if (!existsSync(specJsonPath)) {
    console.error("❌ 仕様書が生成されませんでした");
    return { totalIterations: 0, totalCost, passed: false };
  }

  const spec = JSON.parse(
    readFileSync(specJsonPath, "utf-8")
  ) as ProductSpec;
  console.log(`✅ 仕様書生成完了: ${spec.title}`);

  // ── Phase 2: Continuous Build → QA Loop ──
  let lastQAEval: QAEvaluation | undefined;

  for (let round = 1; round <= cfg.maxBuildRetries; round++) {
    const roundDir = path.join(baseDir, `round-${round}`);
    mkdirSync(roundDir, { recursive: true });

    console.log(`\n${"═".repeat(50)}`);
    console.log(`🔨 ビルドラウンド ${round}/${cfg.maxBuildRetries}`);
    console.log("═".repeat(50));

    // ── Generator: 全体ビルド ──
    console.log("\n🔨 Generator Agent 実行中（連続ビルド）...");
    const generatorPrompt = buildContinuousGeneratorPrompt(
      spec,
      round,
      projectDir,
      lastQAEval
    );

    const genResult = await runAgent(generatorPrompt, {
      systemPrompt: CONTINUOUS_GENERATOR_SYSTEM_PROMPT,
      allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
      permissionMode: "acceptEdits",
      maxTurns: cfg.generatorMaxTurns,
      cwd: projectDir,
      model: cfg.model,
    });
    totalCost += genResult.cost ?? 0;
    console.log("✅ Generator 完了");

    // ── QA Evaluator: 全体評価 ──
    console.log("\n🔍 QA Evaluator Agent 実行中...");
    const evalPath = path.join(roundDir, `qa-evaluation.json`);
    const appUrl = "http://localhost:5173";

    const qaPrompt = buildQAEvaluatorPrompt(
      0, // sprintId=0 means "full app evaluation"
      round,
      appUrl + " （もし接続できなければ http://localhost:3000 や http://localhost:3001 も試すこと）",
      specMdPath,
      evalPath,
      cfg.passThreshold,
      projectDir
    );

    const qaResult = await runAgent(qaPrompt, {
      systemPrompt: QA_EVALUATOR_SYSTEM_PROMPT,
      allowedTools: [
        "Read",
        "Write",
        "Bash",
        "Glob",
        "Grep",
        "mcp__chrome-devtools__navigate_page",
        "mcp__chrome-devtools__take_screenshot",
        "mcp__chrome-devtools__new_page",
        "mcp__chrome-devtools__list_pages",
        "mcp__chrome-devtools__click",
        "mcp__chrome-devtools__fill",
        "mcp__chrome-devtools__press_key",
        "mcp__chrome-devtools__list_console_messages",
        "mcp__chrome-devtools__evaluate_script",
      ],
      permissionMode: "acceptEdits",
      maxTurns: 25,
      cwd: projectDir,
      model: cfg.model,
    });
    totalCost += qaResult.cost ?? 0;

    if (!existsSync(evalPath)) {
      console.error("❌ QA評価ファイルが生成されませんでした");
      continue;
    }

    try {
      const evalData = JSON.parse(
        readFileSync(evalPath, "utf-8")
      ) as QAEvaluation;
      lastQAEval = evalData;

      console.log(`\n📊 QA評価結果 (ラウンド ${round}):`);
      console.log(
        `   製品の深み:      ${evalData.scores.productDepth.score}/10`
      );
      console.log(
        `   機能性:          ${evalData.scores.functionality.score}/10`
      );
      console.log(
        `   ビジュアル:      ${evalData.scores.visualDesign.score}/10`
      );
      console.log(
        `   コード品質:      ${evalData.scores.codeQuality.score}/10`
      );
      console.log(
        `   平均スコア:      ${evalData.averageScore.toFixed(1)}/10`
      );
      console.log(
        `   合格:            ${evalData.passed ? "✅ YES" : "❌ NO"}`
      );
      console.log(`   累計コスト:      $${totalCost.toFixed(4)}`);

      if (evalData.passed) {
        console.log(`\n🎉 合格！全体ビルド完了！`);
        return {
          totalIterations: round,
          totalCost,
          finalScore: evalData.averageScore,
          passed: true,
        };
      }

      console.log(`\n📝 修正すべき点:`);
      evalData.criticalIssues.forEach((issue) =>
        console.log(`   - ${issue}`)
      );
    } catch (e) {
      console.error("❌ QA評価JSONの解析に失敗:", e);
      continue;
    }
  }

  console.log("\n⚠️ 最大リトライに到達。ループ終了。");
  return {
    totalIterations: cfg.maxBuildRetries,
    totalCost,
    finalScore: lastQAEval?.averageScore,
    passed: false,
  };
}

function buildContinuousGeneratorPrompt(
  spec: ProductSpec,
  round: number,
  projectDir: string,
  previousQAEval?: QAEvaluation
): string {
  let prompt = `以下の仕様に基づいてアプリケーション全体を構築してください。

## プロダクト仕様
- タイトル: ${spec.title}
- 説明: ${spec.description}
- 技術スタック: ${JSON.stringify(spec.techStack)}
${spec.designLanguage ? `- デザイン言語: ${JSON.stringify(spec.designLanguage, null, 2)}` : ""}

## 実装すべき全機能
${spec.sprints.map((s) => `### ${s.name}\n${s.description}\n${s.features.map((f) => `- ${f}`).join("\n")}`).join("\n\n")}

## プロジェクトディレクトリ
${projectDir}
`;

  if (round > 1 && previousQAEval) {
    prompt += `
## QAからのフィードバック（前回のビルドで不合格）

### 修正すべき点
${previousQAEval.criticalIssues.map((i) => `- ${i}`).join("\n")}

### 維持すべき点
${previousQAEval.strengths.map((s) => `- ${s}`).join("\n")}

### 全体フィードバック
${previousQAEval.overallFeedback}

### スコア
- 製品の深み: ${previousQAEval.scores.productDepth.score}/10 - ${previousQAEval.scores.productDepth.feedback}
- 機能性: ${previousQAEval.scores.functionality.score}/10 - ${previousQAEval.scores.functionality.feedback}
- ビジュアル: ${previousQAEval.scores.visualDesign.score}/10 - ${previousQAEval.scores.visualDesign.feedback}
- コード品質: ${previousQAEval.scores.codeQuality.score}/10 - ${previousQAEval.scores.codeQuality.feedback}

上記のフィードバックを反映して改善してください。
`;
  }

  prompt += `
## 作業手順
1. まず全体の設計計画を立てる
2. プロジェクトの初期セットアップ（package.json, tsconfig等）
3. バックエンドの実装
4. フロントエンドの実装
5. 統合テスト・バグ修正
6. git add & commit（メッセージ: "build: ${spec.title}"）
`;

  return prompt;
}

