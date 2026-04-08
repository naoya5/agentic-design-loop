# GAN Design Loop — AIに「自分の作品を批判させる」マルチエージェントシステムを作って実験した話

## TL;DR

Anthropicの「[Advancing AI Engineering](https://www.anthropic.com/engineering/advancing-ai-engineering)」記事を参考に、Claude Agent SDKでGenerator（生成）とEvaluator（評価）を分離したマルチエージェントシステムを構築した。フロントエンドデザインとフルスタックアプリの自動生成を3つのモードで実験し、ピボット戦略やスプリント契約交渉といった記事の手法を実装して実際に動かしてみた結果と学びを共有する。

---

## 背景: なぜ「生成と評価の分離」が必要なのか

AIにコードやデザインを生成させると、一つ厄介な問題がある。**自己評価バイアス**だ。

モデルは自分が作った作品を評価する際、明らかに平凡な出来栄えでも自信満々に褒め称える傾向がある。「このデザインは洗練されており、ユーザー体験も優れています」——実際にはBootstrapのデフォルトテンプレートそのままだったとしても。

これはGAN（敵対的生成ネットワーク）の発想で解決できる。生成するエージェントと評価するエージェントを**完全に独立**させ、評価者を「厳しく」チューニングすればいい。

```
Generator（生成） → 成果物 → Evaluator（評価） → フィードバック → Generator（改善）
    ↑                                                              │
    └──────────────────────────────────────────────────────────────┘
```

## アーキテクチャ: 3つのモード

記事を参考に、段階的に3つのモードを実装した。

### Mode 1: Design Loop（フロントエンドデザイン）

最もシンプルな構成。GeneratorがHTML/CSS/JSを生成し、EvaluatorがChrome DevTools MCPでスクリーンショットを撮って視覚的に採点する。

```typescript
// オーケストレーターは普通のTypeScript（エージェントではない）
for (let iteration = 1; iteration <= maxIterations; iteration++) {
  // Generator: HTMLを生成
  await runAgent(generatorPrompt, { maxTurns: 25 });
  
  // Evaluator: スクリーンショットで視覚分析 → 4基準で採点
  await runAgent(evaluatorPrompt, { maxTurns: 20 });
  
  // ベスト更新チェック
  if (evalData.averageScore > bestScore) {
    bestScore = evalData.averageScore;
    bestIteration = iteration;
  }
}
// 全イテレーション完了後、ベストをbest/にコピー
```

重要な設計判断: **合格で即終了しない**。全イテレーションを回し切って、ベストスコアの成果物を最終結果とする。記事でも「10回目の反復で全く異なるアプローチに転換して飛躍した」例が紹介されており、早期終了は機会損失になりうる。

### Mode 2: Fullstack Loop（スプリント型）

Planner → Generator → QA Evaluator の3エージェント構成。スプリント契約交渉が特徴。

```
Planner（仕様作成）
    ↓
[各スプリント]
    ├── 契約交渉（Generator ↔ QA Evaluator）
    ├── Generator（実装）
    └── QA Evaluator（ブラウザで操作テスト）
```

### Mode 3: Continuous Loop（V2 スプリントレス）

記事のV2ハーネスに対応。Opus 4.6のコンテキスト安定性を前提に、スプリント分割を廃止。

```
Planner → Generator（全機能を一括ビルド、maxTurns: 100） → QA Evaluator（1回だけ評価）
```

## 実装した7つの改善

記事を読み込んで現状実装との差分を分析し、7つの改善を特定した。コンフリクトしないタスクを並列でエージェントに委任して実装した。

### 1. 評価者キャリブレーション（Few-shot例）

評価者の採点にブレがあった。スコア4/6/8の3段階のFew-shot例を作成して評価者プロンプトに埋め込んだ。

```typescript
// evaluator-examples.ts
export const EVALUATOR_FEW_SHOT_EXAMPLES = `
### 例1: スコア ~4（低品質）
デザイン概要: Bootstrap未カスタマイズのテンプレート...
- designQuality: 3/10 - 統一感なし、既存テンプレートそのまま
- originality: 2/10 - Bootstrapデフォルト、カスタム要素ゼロ
...

### 例2: スコア ~6（中品質）
...

### 例3: スコア ~8（高品質）
...
`;
```

これにより「スコア6ってこのくらいのレベル」というアンカーが定まり、採点の一貫性が向上した。

### 2. ピボット戦略

記事では「スコアが横ばいになった場合、全く異なる美的方向へピボット」と書かれている。

```typescript
function detectStagnation(scores: number[], window = 3, tolerance = 0.5): boolean {
  if (scores.length < window) return false;
  const recent = scores.slice(-window);
  return (Math.max(...recent) - Math.min(...recent)) <= tolerance;
}
```

直近3回のスコアが±0.5以内なら停滞と判定し、Generatorに「現在のアプローチを完全に破棄せよ」というピボット指示を出す。

### 3. スプリント契約交渉

記事の核心的な仕組み。各スプリント前にGeneratorとQA Evaluatorが「完了の定義」を合意する。

```
Generator → contract-proposal.json（テスト基準15-20件）
    ↓
QA Evaluator → contract-review.json（追加・修正）
    ↓
contract-final.json（合意済み契約）
```

QAはこの契約に基づいて各テスト基準をPASS/FAILで判定するため、評価が具体的で実行可能になる。

### 4. デザイン言語

Plannerが仕様にビジュアルデザイン言語（カラーパレット、タイポグラフィ、スペーシング等）を含めるようにした。テンプレート的なデフォルトを避ける指示付き。

### 5. AI機能の自動組み込み

PlannerにClaude API活用機能を仕様に含めるよう指示。Generatorにはバックエンドプロキシパターンのコード例を提供。

### 6. V2 スプリントレスハーネス

Opus 4.6のコンテキスト安定性を活かし、スプリント分割なしの一括ビルドモードを新設。

### 7. モデル選択と動的コスト計算

```typescript
export const MODEL_PRICING: Record<ModelId, ModelPricing> = {
  "claude-opus-4-6":           { inputPerMillion: 15,   outputPerMillion: 75 },
  "claude-sonnet-4-6":         { inputPerMillion: 3,    outputPerMillion: 15 },
  "claude-haiku-4-5-20251001": { inputPerMillion: 0.80, outputPerMillion: 4  },
};
```

CLIから`--model claude-opus-4-6`で切り替え可能。

## 実験結果

### 実験1: オランダ美術館（Design Loop, Sonnet）

```
プロンプト: 「オランダの美術館のウェブサイト。洗練されたダークテーマ」
閾値: 6.5 / イテレーション: 3回
```

**結果: イテレーション1で合格（7.0/10）、$1.17**

初回からレンブラントのキアロスクーロ（明暗法）をテーマにした独自コンセプトを生成。Few-shot例と評価基準の文言が「AIっぽいパターンを避けよ」とGeneratorを導いた効果。

### 実験2: 高級寿司レストラン（Design Loop, Sonnet）

```
プロンプト: 「東京の高級寿司レストラン。予約システムと季節のおまかせコース」
閾値: 9.0 / イテレーション: 5回（--early-exit）
```

**スコア推移:**
```
Iter 1: 6.5  ダーク×ゴールド路線
Iter 2: 6.8  Unsplash画像追加
Iter 3: 6.5  コントラスト問題で後退
Iter 4: 7.3  🔄 ピボット発動！ダーク→クリーム×クリムゾンに大転換
Iter 5: 8.0  ピボット路線を洗練、デザインの質 9/10
```

**$2.89 / 5イテレーション**

イテレーション3でスコアが6.5付近に停滞 → 自動でピボット検出 → イテレーション4で「和紙クリーム×クリムゾン」という全く異なる美的方向に転換 → 7.3に飛躍。記事の「10回目で方向転換して飛躍」パターンが再現された。

### 実験3: 読書管理アプリ（Continuous Loop, Sonnet）

```
プロンプト: 「本の登録・読了記録・5段階評価・読書メモ、月別グラフ、ジャンル別統計」
閾値: 9.0 / 最大3ラウンド
```

**スコア推移:**
```
Round 1: 8.5  サーバー起動確認できず
Round 2: 8.0  Wishlist優先度未実装、月別ページ数なし
Round 3: 8.8  テスト不在、AI疎通未確認
```

**$1.15 / 3ラウンド**

QAフィードバックが非常に具体的に機能した。ラウンド2→3では「DBにpriority/read_dateカラム追加」「月別SUM(pages)」「ジャンル別AVG(rating)」をマイグレーション付きで修正。閾値9には0.2足りず。

### 実験4: プロジェクト管理ツール（Continuous Loop, Opus 4.6）

```
プロンプト: 「カンバンボード、ガントチャート、依存関係管理、バーンダウンチャート」
閾値: 9.0 / 最大3ラウンド / --model claude-opus-4-6
```

**スコア推移:**
```
Round 1: 7.5  ダークモードCSS漏れ、api.tsがany型
Round 2: 7.5  エラー握り潰し、ハードコード色20箇所+
Round 3: 7.3  インラインスタイル219箇所、テスト皆無
```

**$10.55 / 3ラウンド**

Opusの実力が光ったのはラウンド1の一括ビルド。dnd-kitによるカンバン、SVGベースのガントチャート、クリティカルパス計算、AI連携（タスク分解・リスク分析）まで一発で生成。ラウンド2では24ファイル、+589/-454行の大規模リファクタリングを実行。

ただし、Chrome DevTools MCPが切断中でQAがブラウザ操作テストできなかったため、コード分析中心の評価になりスコアが伸びなかった。

## コスト比較

| 実験 | モデル | モード | ラウンド | 最終スコア | コスト |
|------|--------|--------|---------|-----------|--------|
| 美術館 | Sonnet | design | 1 | 7.0 | $1.17 |
| 寿司 | Sonnet | design | 5 | 8.0 | $2.89 |
| 読書管理 | Sonnet | continuous | 3 | 8.8 | $1.15 |
| 家計簿 | Sonnet | continuous | 1 | 7.5 | $0.26 |
| TaskFlow | Opus | continuous | 3 | 7.3 | $10.55 |

記事のV1ハーネス（$200）やV2ハーネス（$124）と比べると桁違いに安い。これはイテレーション回数の差が主因。

## 学んだこと

### 1. 評価基準の文言がGeneratorの出力を直接形作る

「最高のデザインは美術館級である」「AIっぽいパターンは即不合格」といったフレーズを評価基準に含めるだけで、初回の出力品質が大きく変わった。評価者のプロンプトは、実質的にGeneratorへの間接的な指示になる。

### 2. ピボットは本当に機能する

スコア停滞 → 自動ピボット → 飛躍、というパターンが寿司レストランの実験で見事に再現された。漸進的改善だけでは超えられない壁がある。

### 3. QAの厳しさはチューニングが必要

初期のQAは甘すぎた。maxTurnsが足りない、ポートを見つけられない、表面的なテストで終わるなどの問題があった。評価者を「使える」レベルにするには何度もログを読んで調整する必要がある。記事でも「評価ツールをこのレベルで動作させるには、かなりの労力が必要でした」と書かれている通り。

### 4. モデルの進化に合わせてハーネスを簡素化する

記事の核心的な教訓。Sonnet用に作ったスプリント分割が、Opus 4.6では不要になった。ハーネスのすべてのコンポーネントは「モデルが単独ではできないこと」の仮定をエンコードしており、その仮定はモデルの改善で陳腐化する。

### 5. Chrome DevTools MCPの接続が評価品質を左右する

QAがブラウザを実際に操作できるかどうかで、評価の質が劇的に変わる。コード分析だけでは「ボタンを押したら何が起きるか」がわからない。MCP接続の安定性はハーネス全体の品質のボトルネック。

## 技術スタック

- **ランタイム**: Node.js 20+ / TypeScript
- **エージェントSDK**: `@anthropic-ai/claude-agent-sdk`
- **ブラウザ自動化**: Chrome DevTools MCP
- **モデル**: Claude Sonnet 4.6 / Opus 4.6
- **生成アプリ**: React + Vite + Express + SQLite

## おわりに

GANの「生成と評価の分離」は、AIエンジニアリングにおける強力なパターンだ。単一エージェントの自己評価では超えられない品質の壁を、独立した評価者のフィードバックループで突破できる。

記事が述べている通り、「興味深いハーネスの組み合わせの空間は、モデルの精度向上に伴って縮小するのではなく、むしろ拡大していく」。モデルが賢くなるほど、より野心的なタスクに挑戦でき、そこにはまた新しいハーネス設計の余地が生まれる。

ソースコードは [gan-design-loop](https://github.com/naoya5/claude-sdk/tree/main/gan-design-loop) で公開している。

---

*使用モデル: Claude Sonnet 4.6 / Opus 4.6*
*総実験コスト: 約$16*
