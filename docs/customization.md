# カスタマイズガイド

## プロンプトのカスタマイズ

### Generator のスタイルを変える

`src/prompts/generator.ts` の `GENERATOR_SYSTEM_PROMPT` を編集する。

```typescript
// 例: 和風デザインに特化させる
export const GENERATOR_SYSTEM_PROMPT = `あなたは和風ウェブデザインの専門家です。
日本の伝統美（余白の美、わびさび）をモダンなウェブ技術で表現します。
...
`;
```

### Evaluator の厳しさを調整する

`src/prompts/evaluator.ts` の `EVALUATOR_SYSTEM_PROMPT` 内のスコア基準を編集する。

```typescript
// 厳しくする例
// 「7点以上: プロのデザイナーが作ったと感じられるレベル」
// → 「7点以上: 有名デザインエージェンシーの作品レベル」
```

## パラメータの調整

### DesignLoopConfig

`src/types.ts` の `DEFAULT_DESIGN_CONFIG` を変更するか、CLI 引数で指定する。

| パラメータ | デフォルト | 説明 |
|-----------|----------|------|
| `maxIterations` | 10 | 最大ループ回数 |
| `passThreshold` | 7.0 | 合格に必要な平均スコア |
| `model` | undefined (デフォルトモデル) | 使用するモデル |
| `outputDir` | `"output"` | 出力ディレクトリ |

### FullstackLoopConfig

| パラメータ | デフォルト | 説明 |
|-----------|----------|------|
| `maxSprintRetries` | 3 | スプリントあたりの最大リトライ数 |
| `passThreshold` | 7.0 | 合格に必要な平均スコア |
| `model` | undefined | 使用するモデル |
| `outputDir` | `"output"` | 出力ディレクトリ |

## モデルの選択

コスト vs 品質のトレードオフに応じてモデルを選択する。

```typescript
// コスト重視: Haiku で高速に回す
runDesignLoop("プロンプト", { model: "claude-haiku-4-5-20251001" });

// バランス: Sonnet（デフォルト）
runDesignLoop("プロンプト");

// 品質重視: Opus で最高品質
runDesignLoop("プロンプト", { model: "claude-opus-4-6" });
```

**推奨構成:**
- Generator: Sonnet（コードと創造性のバランス）
- Evaluator: Sonnet（視覚分析に十分な能力）
- Planner: Sonnet（仕様の構造化に適する）

モデルをエージェントごとに変えたい場合は、`design-loop.ts` / `fullstack-loop.ts` の `runAgent()` 呼び出しで個別に `model` を指定する。

## エージェントに渡すツールの変更

各エージェントの `allowedTools` を編集することで、使えるツールを制限・拡張できる。

```typescript
// 例: Generator に WebSearch を追加（参考デザインを検索させる）
const genResult = await runAgent(generatorPrompt, {
  allowedTools: ["Read", "Write", "Bash", "Glob", "WebSearch"],
  // ...
});
```

## プログラムからの呼び出し

CLI だけでなく、TypeScript から直接呼び出すこともできる。

```typescript
import { runDesignLoop } from "./design-loop.js";
import { runFullstackLoop } from "./fullstack-loop.js";

// Phase 1
const result1 = await runDesignLoop("ランディングページ", {
  maxIterations: 5,
  passThreshold: 6.5,
});
console.log(`${result1.totalIterations} 回で完了、コスト: $${result1.totalCost.toFixed(4)}`);

// Phase 2
const result2 = await runFullstackLoop("Todoアプリ", {
  maxSprintRetries: 2,
  passThreshold: 6.0,
});
```

## 独自の評価基準を追加する

`src/types.ts` の `DesignEvaluation` に新しい基準を追加し、Evaluator のプロンプトに反映する。

```typescript
// 1. types.ts に追加
interface DesignEvaluation {
  scores: {
    // 既存の4基準
    designQuality: CriterionScore;
    originality: CriterionScore;
    technical: CriterionScore;
    functionality: CriterionScore;
    // 新規追加
    accessibility: CriterionScore;  // アクセシビリティ
  };
  // ...
}

// 2. evaluator.ts のシステムプロンプトに基準を追加
// 3. design-loop.ts のスコア表示に追加
```
