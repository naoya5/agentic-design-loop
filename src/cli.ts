#!/usr/bin/env node
import { runDesignLoop } from "./design-loop.js";
import { runFullstackLoop } from "./fullstack-loop.js";
import { runContinuousLoop } from "./continuous-loop.js";

function parseArgs(args: string[]) {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].slice(2);
      if (key === "early-exit" || key === "help") {
        flags[key] = true;
      } else {
        flags[key] = args[++i];
      }
    } else {
      positional.push(args[i]);
    }
  }
  return { flags, positional };
}

function showHelp() {
  console.log(`
agentic-design-loop (adl) — GAN的マルチエージェント設計ループ

使い方:
  adl <command> <prompt> [options]

コマンド:
  design      フロントエンドデザインループ（HTML生成 → 視覚評価 → フィードバック）
  fullstack   スプリント型フルスタック（Planner → Sprint契約 → Generator → QA）
  continuous  V2 スプリントレス一括ビルド（Opus 4.6向き）

オプション:
  --iterations <n>   デザインループのイテレーション数（デフォルト: 10）
  --retries <n>      fullstackのスプリントリトライ上限（デフォルト: 3）
  --rounds <n>       continuousのビルドラウンド上限（デフォルト: 3）
  --threshold <n>    合格閾値（デフォルト: 7.0）
  --model <id>       モデル指定（claude-opus-4-6 / claude-sonnet-4-6 / claude-haiku-4-5-20251001）
  --early-exit       デザインループで合格時に即終了
  --help             ヘルプ表示

例:
  adl design "モダンなポートフォリオサイト" --iterations 5 --threshold 8
  adl fullstack "Todoアプリ（React + Express）" --model claude-opus-4-6
  adl continuous "DAWアプリ" --rounds 3 --threshold 9 --model claude-opus-4-6
`);
}

async function main() {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  if (flags.help || positional.length === 0) {
    showHelp();
    process.exit(0);
  }

  const command = positional[0];
  const prompt = positional[1];

  if (!prompt) {
    console.error("エラー: プロンプトを指定してください");
    showHelp();
    process.exit(1);
  }

  const model = flags.model as string | undefined;
  const threshold = flags.threshold ? parseFloat(flags.threshold as string) : undefined;

  switch (command) {
    case "design": {
      const iterations = flags.iterations ? parseInt(flags.iterations as string) : undefined;
      const earlyExit = !!flags["early-exit"];
      const summary = await runDesignLoop(prompt, {
        maxIterations: iterations,
        passThreshold: threshold,
        earlyExit,
        model,
      });
      printSummary("Design Loop", summary);
      break;
    }
    case "fullstack": {
      const retries = flags.retries ? parseInt(flags.retries as string) : undefined;
      const summary = await runFullstackLoop(prompt, {
        maxSprintRetries: retries,
        passThreshold: threshold,
        model,
      });
      printSummary("Fullstack Loop", summary);
      break;
    }
    case "continuous": {
      const rounds = flags.rounds ? parseInt(flags.rounds as string) : undefined;
      const summary = await runContinuousLoop(prompt, {
        maxBuildRetries: rounds,
        passThreshold: threshold,
        model,
      });
      printSummary("Continuous Loop", summary);
      break;
    }
    default:
      console.error(`不明なコマンド: ${command}`);
      showHelp();
      process.exit(1);
  }
}

function printSummary(mode: string, summary: { totalIterations: number; totalCost: number; finalScore?: number; passed: boolean }) {
  console.log("\n" + "=".repeat(60));
  console.log(`📋 ${mode} 最終サマリー`);
  console.log("=".repeat(60));
  console.log(`  イテレーション: ${summary.totalIterations}`);
  console.log(`  スコア:         ${summary.finalScore?.toFixed(1) ?? "N/A"}/10`);
  console.log(`  合格:           ${summary.passed ? "YES" : "NO"}`);
  console.log(`  総コスト:       $${summary.totalCost.toFixed(4)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
