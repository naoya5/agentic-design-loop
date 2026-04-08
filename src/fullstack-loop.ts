import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { runAgent } from "./run-agent.js";
import { archiveOutput } from "./archive.js";
import {
  PLANNER_SYSTEM_PROMPT,
  buildPlannerPrompt,
} from "./prompts/planner.js";
import { GENERATOR_SYSTEM_PROMPT } from "./prompts/generator.js";
import {
  QA_EVALUATOR_SYSTEM_PROMPT,
  buildQAEvaluatorPrompt,
} from "./prompts/qa-evaluator.js";
import type {
  ProductSpec,
  Sprint,
  SprintContract,
  QAEvaluation,
  FullstackLoopConfig,
  LoopSummary,
} from "./types.js";
import { DEFAULT_FULLSTACK_CONFIG } from "./types.js";

const FULLSTACK_GENERATOR_SYSTEM_PROMPT = `あなたはフルスタックエンジニアです。
仕様書に基づいてアプリケーションをスプリント単位で実装します。

## 作業ルール

1. 指定されたスプリントの機能のみを実装すること
2. 前のスプリントで実装済みの機能を壊さないこと
3. 各ファイルを書き出した後、動作確認のためにビルド・起動を試みること
4. QAに渡す前に自己評価を実施し、明らかなバグは自分で修正すること
5. gitでコミットすること（スプリント完了時）

## 技術ガイドライン

- 小さく始めて確実に動くものを作る
- 型安全性を確保する
- エラーハンドリングを適切に行う
- コンポーネント分割を意識する

## AI機能の実装パターン

仕様にAI機能が含まれている場合、以下のパターンで実装すること：

### バックエンド（APIプロキシ）
\`\`\`typescript
// routes/ai.ts の例
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic(); // ANTHROPIC_API_KEY 環境変数を自動読み込み

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

### フロントエンド（API呼び出し）
\`\`\`typescript
// AI機能のフック例
async function useAI(prompt: string): Promise<string> {
  const res = await fetch("/api/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  const data = await res.json();
  return data.result;
}
\`\`\`

### 依存パッケージ
バックエンドに \`@anthropic-ai/sdk\` をインストールすること。

### 注意点
- APIキーはフロントエンドに直接埋め込まないこと
- AI呼び出しにはローディング状態を表示すること
- エラー時のフォールバックを用意すること
- レート制限を考慮し、デバウンスやキャッシュを実装すること
`;

/**
 * フルスタック3エージェントループを実行する。
 *
 * Planner → (Generator → QA Evaluator) x sprints
 */
export async function runFullstackLoop(
  userPrompt: string,
  config: Partial<FullstackLoopConfig> = {}
): Promise<LoopSummary> {
  const cfg = {
    ...DEFAULT_FULLSTACK_CONFIG,
    ...Object.fromEntries(
      Object.entries(config).filter(([, v]) => v !== undefined)
    ),
  } as FullstackLoopConfig;
  const baseDir = path.resolve(cfg.outputDir, "fullstack");
  archiveOutput(baseDir, "fullstack");
  const projectDir = path.join(baseDir, "app");
  mkdirSync(projectDir, { recursive: true });

  let totalCost = 0;
  let totalIterations = 0;

  console.log("=".repeat(60));
  console.log("Full-stack 3-Agent Loop 開始");
  console.log(`プロンプト: ${userPrompt}`);
  console.log(`スプリントリトライ上限: ${cfg.maxSprintRetries}`);
  console.log(`合格閾値: ${cfg.passThreshold}`);
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
  console.log(`   スプリント数: ${spec.sprints.length}`);
  spec.sprints.forEach((s) => console.log(`   - Sprint ${s.id}: ${s.name}`));

  // ── Phase 2: Sprint Loop ──
  for (const sprint of spec.sprints) {
    const sprintDir = path.join(baseDir, `sprint-${sprint.id}`);
    mkdirSync(sprintDir, { recursive: true });

    console.log(`\n${"═".repeat(50)}`);
    console.log(`🏃 Sprint ${sprint.id}: ${sprint.name}`);
    console.log("═".repeat(50));

    let sprintPassed = false;

    // ── Contract Negotiation ──
    console.log("\n📋 スプリント契約の交渉...");
    const contract = await negotiateSprintContract(spec, sprint, projectDir, baseDir, cfg.model);
    if (contract) {
      console.log(`   テスト基準: ${contract.testCriteria.length}件`);
      console.log(`   完了条件: ${contract.acceptanceCriteria.length}件`);
    }

    for (let attempt = 1; attempt <= cfg.maxSprintRetries; attempt++) {
      totalIterations++;

      console.log(`\n── 試行 ${attempt}/${cfg.maxSprintRetries} ──`);

      // ── Generator ──
      console.log("\n🔨 Generator Agent 実行中...");
      const prevEvalPath = path.join(
        sprintDir,
        `qa-evaluation-attempt-${attempt - 1}.json`
      );
      const prevEval =
        attempt > 1 && existsSync(prevEvalPath)
          ? (JSON.parse(readFileSync(prevEvalPath, "utf-8")) as QAEvaluation)
          : undefined;

      const generatorPrompt = buildSprintGeneratorPrompt(
        spec,
        sprint,
        attempt,
        projectDir,
        prevEval,
        contract ?? undefined
      );

      const genResult = await runAgent(generatorPrompt, {
        systemPrompt: FULLSTACK_GENERATOR_SYSTEM_PROMPT,
        allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
        permissionMode: "acceptEdits",
        maxTurns: 30,
        cwd: projectDir,
        model: cfg.model,
      });
      totalCost += genResult.cost ?? 0;
      console.log(`✅ Generator 完了`);

      // ── QA Evaluator ──
      console.log("\n🔍 QA Evaluator Agent 実行中...");
      const evalPath = path.join(
        sprintDir,
        `qa-evaluation-attempt-${attempt}.json`
      );

      // devサーバーのURL（Vite: 5173、Express/Next: 3000 等）
      const appUrl = "http://localhost:5173 （もし接続できなければ http://localhost:3000 や http://localhost:3001 も試すこと）";

      const qaPrompt = buildQAEvaluatorPrompt(
        sprint.id,
        attempt,
        appUrl,
        specMdPath,
        evalPath,
        cfg.passThreshold,
        projectDir,
        contract ?? undefined
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

      // 評価結果の読み取り
      if (!existsSync(evalPath)) {
        console.error("❌ QA評価ファイルが生成されませんでした");
        continue;
      }

      try {
        const evalData = JSON.parse(
          readFileSync(evalPath, "utf-8")
        ) as QAEvaluation;

        console.log(`\n📊 QA評価結果 (Sprint ${sprint.id}, 試行 ${attempt}):`);
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
          console.log(`\n🎉 Sprint ${sprint.id} 合格！`);
          sprintPassed = true;
          break;
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

    if (!sprintPassed) {
      console.log(
        `\n⚠️ Sprint ${sprint.id} が ${cfg.maxSprintRetries} 回のリトライ後も不合格`
      );
      return {
        totalIterations,
        totalCost,
        passed: false,
      };
    }
  }

  console.log("\n🎉 全スプリント完了！");
  return {
    totalIterations,
    totalCost,
    passed: true,
  };
}

async function negotiateSprintContract(
  spec: ProductSpec,
  sprint: Sprint,
  projectDir: string,
  baseDir: string,
  model?: string,
): Promise<SprintContract | null> {
  const contractDir = path.join(baseDir, `sprint-${sprint.id}`);
  const proposalPath = path.join(contractDir, "contract-proposal.json");
  const reviewPath = path.join(contractDir, "contract-review.json");
  const finalPath = path.join(contractDir, "contract-final.json");

  console.log("  📝 Generator がスプリント契約を提案中...");

  // Generator proposes contract
  const proposalPrompt = `スプリント ${sprint.id}: ${sprint.name} のスプリント契約を提案してください。

## プロダクト仕様
- タイトル: ${spec.title}
- 説明: ${spec.description}
- 技術スタック: ${JSON.stringify(spec.techStack)}

## Sprint ${sprint.id}: ${sprint.name}
${sprint.description}

### 機能
${sprint.features.map((f) => `- ${f}`).join("\n")}

## プロジェクトディレクトリ
${projectDir}

## 指示
以下のJSON形式でスプリント契約を ${proposalPath} に書き出してください：
\`\`\`json
{
  "sprintId": ${sprint.id},
  "scope": "このスプリントで構築する内容の要約",
  "testCriteria": [
    "テスト可能な具体的な動作1（例: ユーザーがフォームに入力してSubmitボタンを押すとデータが保存される）",
    "テスト可能な具体的な動作2",
    "..."
  ],
  "acceptanceCriteria": [
    "完了条件1（例: 全APIエンドポイントが200を返す）",
    "完了条件2",
    "..."
  ],
  "agreedAt": ""
}
\`\`\`

testCriteriaは、QAエンジニアがブラウザで実際にテストできる具体的な動作を記述してください。
最低10個、できれば15-20個のテスト基準を含めてください。`;

  await runAgent(proposalPrompt, {
    systemPrompt: "あなたはフルスタックエンジニアです。スプリントの実装計画を立て、テスト可能な契約を提案します。",
    allowedTools: ["Read", "Write", "Glob"],
    permissionMode: "acceptEdits",
    maxTurns: 10,
    cwd: projectDir,
    model,
  });

  if (!existsSync(proposalPath)) {
    console.error("  ❌ 契約提案が生成されませんでした");
    return null;
  }

  console.log("  🔍 QA Evaluator が契約をレビュー中...");

  // QA reviews contract
  const reviewPrompt = `以下のスプリント契約を精査してください。

## 契約提案
${readFileSync(proposalPath, "utf-8")}

## 仕様
- Sprint ${sprint.id}: ${sprint.name}
- 機能: ${sprint.features.join(", ")}

## 指示
契約の testCriteria と acceptanceCriteria を精査し、以下を確認してください：
1. テスト基準は十分に具体的か（曖昧な表現がないか）
2. 重要な機能のテストが漏れていないか
3. エッジケース（空入力、長文、エラー状態）のテストが含まれているか

レビュー結果を ${reviewPath} にJSON形式で書き出してください：
\`\`\`json
{
  "approved": true/false,
  "addedCriteria": ["追加すべきテスト基準（あれば）"],
  "removedCriteria": ["不要なテスト基準（あれば）"],
  "feedback": "レビューコメント"
}
\`\`\``;

  await runAgent(reviewPrompt, {
    systemPrompt: "あなたは厳格なQAエンジニアです。テスト計画をレビューし、不足や曖昧さを指摘します。",
    allowedTools: ["Read", "Write"],
    permissionMode: "acceptEdits",
    maxTurns: 5,
    cwd: projectDir,
    model,
  });

  // Merge proposal + review into final contract
  try {
    const proposal = JSON.parse(readFileSync(proposalPath, "utf-8"));
    let finalContract: SprintContract = {
      sprintId: sprint.id,
      scope: proposal.scope,
      testCriteria: [...proposal.testCriteria],
      acceptanceCriteria: [...proposal.acceptanceCriteria],
      agreedAt: new Date().toISOString(),
    };

    if (existsSync(reviewPath)) {
      const review = JSON.parse(readFileSync(reviewPath, "utf-8"));
      if (review.addedCriteria?.length) {
        finalContract.testCriteria.push(...review.addedCriteria);
      }
      if (review.removedCriteria?.length) {
        finalContract.testCriteria = finalContract.testCriteria.filter(
          (c: string) => !review.removedCriteria.includes(c)
        );
      }
      console.log(`  ✅ 契約合意（テスト基準: ${finalContract.testCriteria.length}件）`);
    }

    writeFileSync(finalPath, JSON.stringify(finalContract, null, 2));
    return finalContract;
  } catch (e) {
    console.error("  ❌ 契約のマージに失敗:", e);
    return null;
  }
}

function buildSprintGeneratorPrompt(
  spec: ProductSpec,
  sprint: ProductSpec["sprints"][number],
  attempt: number,
  projectDir: string,
  previousQAEval?: QAEvaluation,
  contract?: SprintContract
): string {
  let prompt = `以下の仕様に基づいてスプリント ${sprint.id} を実装してください。

## プロダクト仕様
- タイトル: ${spec.title}
- 説明: ${spec.description}
- 技術スタック: ${JSON.stringify(spec.techStack)}

## Sprint ${sprint.id}: ${sprint.name}
${sprint.description}

### 実装する機能
${sprint.features.map((f) => `- ${f}`).join("\n")}

## プロジェクトディレクトリ
${projectDir}
`;

  if (contract) {
    prompt += `
## スプリント契約（QAと合意済み）

### スコープ
${contract.scope}

### テスト基準（QAがこれらをテストします）
${contract.testCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

### 完了条件
${contract.acceptanceCriteria.map((c) => `- ${c}`).join("\n")}

上記のテスト基準を全て満たすように実装してください。
`;
  }

  if (attempt > 1 && previousQAEval) {
    prompt += `
## QAからのフィードバック（前回の試行で不合格）

### 修正すべき点
${previousQAEval.criticalIssues.map((i) => `- ${i}`).join("\n")}

### 維持すべき点
${previousQAEval.strengths.map((s) => `- ${s}`).join("\n")}

### 全体フィードバック
${previousQAEval.overallFeedback}

上記のフィードバックを反映して改善してください。
`;
  }

  prompt += `
## 作業完了後
1. 依存パッケージをインストール（必要な場合）
2. ビルドが通ることを確認
3. git add & commit（メッセージ: "sprint-${sprint.id}: ${sprint.name}"）
`;

  return prompt;
}

