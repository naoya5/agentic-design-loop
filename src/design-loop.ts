import { readFileSync, copyFileSync, mkdirSync, existsSync } from "fs";
import path from "path";
import { runAgent } from "./run-agent.js";
import { archiveOutput } from "./archive.js";
import {
  GENERATOR_SYSTEM_PROMPT,
  buildGeneratorPrompt,
} from "./prompts/generator.js";
import {
  EVALUATOR_SYSTEM_PROMPT,
  buildEvaluatorPrompt,
} from "./prompts/evaluator.js";
import type {
  DesignEvaluation,
  DesignLoopConfig,
  LoopSummary,
} from "./types.js";
import { DEFAULT_DESIGN_CONFIG } from "./types.js";

/**
 * スコア履歴から停滞を検出する。
 * 直近 window 件のスコアが tolerance 以内に収まっていれば停滞とみなす。
 */
function detectStagnation(scores: number[], window: number = 3, tolerance: number = 0.5): boolean {
  if (scores.length < window) return false;
  const recent = scores.slice(-window);
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  return (max - min) <= tolerance;
}

/**
 * フロントエンドデザインのGAN的ループを実行する。
 *
 * Generator がHTMLを生成 → Evaluator がスクリーンショットで評価 → フィードバックループ
 */
export async function runDesignLoop(
  userPrompt: string,
  config: Partial<DesignLoopConfig> = {}
): Promise<LoopSummary> {
  const cfg = {
    ...DEFAULT_DESIGN_CONFIG,
    ...Object.fromEntries(
      Object.entries(config).filter(([, v]) => v !== undefined)
    ),
  } as DesignLoopConfig;
  const baseDir = path.resolve(cfg.outputDir);
  archiveOutput(baseDir, "design");
  let totalCost = 0;
  let lastEvaluation: DesignEvaluation | undefined;
  const scoreHistory: number[] = [];
  let bestScore = -1;
  let bestIteration = 0;

  console.log("=".repeat(60));
  console.log("GAN Design Loop 開始");
  console.log(`プロンプト: ${userPrompt}`);
  console.log(`イテレーション: ${cfg.maxIterations}回`);
  console.log(`合格閾値: ${cfg.passThreshold}`);
  console.log(`モード: ${cfg.earlyExit ? "合格で即終了" : "全回実行→ベスト採用"}`);
  console.log("=".repeat(60));

  for (let iteration = 1; iteration <= cfg.maxIterations; iteration++) {
    const iterDir = path.join(baseDir, `iteration-${iteration}`);
    mkdirSync(iterDir, { recursive: true });

    const htmlPath = path.join(iterDir, "index.html");
    const evalPath = path.join(iterDir, "evaluation.json");

    console.log(`\n${"─".repeat(40)}`);
    console.log(`イテレーション ${iteration}/${cfg.maxIterations}`);
    console.log("─".repeat(40));

    // ── Generator ──
    console.log("\n🎨 Generator 実行中...");
    const previousHtmlPath =
      iteration > 1
        ? path.join(baseDir, `iteration-${iteration - 1}`, "index.html")
        : undefined;

    const isStagnant = detectStagnation(scoreHistory);
    if (isStagnant) {
      console.log(`\n🔄 スコア停滞を検出 — ピボットモードで再生成します`);
    }

    const generatorPrompt = buildGeneratorPrompt(
      userPrompt,
      iteration,
      htmlPath,
      lastEvaluation
        ? {
            criticalIssues: lastEvaluation.criticalIssues,
            strengths: lastEvaluation.strengths,
            overallFeedback: lastEvaluation.overallFeedback,
            scores: lastEvaluation.scores,
          }
        : undefined,
      previousHtmlPath,
      isStagnant
    );

    const genResult = await runAgent(generatorPrompt, {
      systemPrompt: GENERATOR_SYSTEM_PROMPT,
      allowedTools: ["Read", "Write", "Bash", "Glob"],
      permissionMode: "acceptEdits",
      maxTurns: 25,
      cwd: baseDir,
      model: cfg.model,
    });
    totalCost += genResult.cost ?? 0;

    // HTMLが生成されたか確認
    if (!existsSync(htmlPath)) {
      console.error(`❌ HTMLファイルが生成されませんでした: ${htmlPath}`);
      continue;
    }
    console.log(`✅ HTML生成完了: ${htmlPath}`);

    // ── Evaluator ──
    console.log("\n🔍 Evaluator 実行中...");
    const evaluatorPrompt = buildEvaluatorPrompt(
      iteration,
      htmlPath,
      evalPath,
      cfg.passThreshold
    );

    const evalResult = await runAgent(evaluatorPrompt, {
      systemPrompt: EVALUATOR_SYSTEM_PROMPT,
      allowedTools: [
        "Read",
        "Write",
        "Bash",
        "mcp__chrome-devtools__navigate_page",
        "mcp__chrome-devtools__take_screenshot",
        "mcp__chrome-devtools__new_page",
        "mcp__chrome-devtools__list_pages",
      ],
      permissionMode: "acceptEdits",
      maxTurns: 20,
      cwd: baseDir,
      model: cfg.model,
    });
    totalCost += evalResult.cost ?? 0;

    // 評価結果を読み取り
    if (!existsSync(evalPath)) {
      console.error(`❌ 評価ファイルが生成されませんでした: ${evalPath}`);
      continue;
    }

    try {
      const evalData = JSON.parse(
        readFileSync(evalPath, "utf-8")
      ) as DesignEvaluation;
      lastEvaluation = evalData;
      scoreHistory.push(evalData.averageScore);

      console.log(`\n📊 評価結果 (イテレーション ${iteration}):`);
      console.log(
        `   デザインの質:  ${evalData.scores.designQuality.score}/10`
      );
      console.log(`   独創性:        ${evalData.scores.originality.score}/10`);
      console.log(`   技術面:        ${evalData.scores.technical.score}/10`);
      console.log(
        `   機能性(UX):    ${evalData.scores.functionality.score}/10`
      );
      console.log(`   平均スコア:    ${evalData.averageScore.toFixed(1)}/10`);
      console.log(`   累計コスト:    $${totalCost.toFixed(4)}`);

      // ベスト更新チェック
      if (evalData.averageScore > bestScore) {
        bestScore = evalData.averageScore;
        bestIteration = iteration;
        console.log(`   🏆 ベスト更新！（イテレーション ${iteration}）`);
      } else {
        console.log(`   📌 現在のベスト: イテレーション ${bestIteration}（${bestScore.toFixed(1)}/10）`);
      }

      // 早期終了モード
      if (cfg.earlyExit && evalData.averageScore >= cfg.passThreshold) {
        console.log(`\n🎉 合格！ループ終了！`);
        // best/ にコピー
        const bestDir = path.join(baseDir, "best");
        mkdirSync(bestDir, { recursive: true });
        if (existsSync(htmlPath)) copyFileSync(htmlPath, path.join(bestDir, "index.html"));
        if (existsSync(evalPath)) copyFileSync(evalPath, path.join(bestDir, "evaluation.json"));
        return {
          totalIterations: iteration,
          totalCost,
          finalScore: evalData.averageScore,
          passed: true,
        };
      }

      if (evalData.criticalIssues.length > 0) {
        console.log(`\n📝 修正すべき点:`);
        evalData.criticalIssues.forEach((issue) => console.log(`   - ${issue}`));
      }
    } catch (e) {
      console.error(`❌ 評価JSONの解析に失敗:`, e);
      continue;
    }
  }

  // ── ベストイテレーションを best/ にコピー ──
  if (bestIteration > 0) {
    const bestDir = path.join(baseDir, "best");
    mkdirSync(bestDir, { recursive: true });
    const srcHtml = path.join(baseDir, `iteration-${bestIteration}`, "index.html");
    const srcEval = path.join(baseDir, `iteration-${bestIteration}`, "evaluation.json");
    if (existsSync(srcHtml)) copyFileSync(srcHtml, path.join(bestDir, "index.html"));
    if (existsSync(srcEval)) copyFileSync(srcEval, path.join(bestDir, "evaluation.json"));

    console.log("\n" + "─".repeat(40));
    console.log(`🏆 ベスト: イテレーション ${bestIteration}（${bestScore.toFixed(1)}/10）`);
    console.log(`   → ${path.join(bestDir, "index.html")}`);
    console.log("─".repeat(40));
  }

  return {
    totalIterations: cfg.maxIterations,
    totalCost,
    finalScore: bestScore > 0 ? bestScore : lastEvaluation?.averageScore,
    passed: bestScore >= cfg.passThreshold,
  };
}

