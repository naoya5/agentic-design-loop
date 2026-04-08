# GAN Design Loop

Claude Agent SDK を使ったマルチエージェントの GAN 的デザイン＆開発ループ。

[Anthropic の GAN-inspired design 記事](https://www.anthropic.com/engineering/advancing-ai-engineering)に基づき、Generator（生成）と Evaluator（評価）を分離し、フィードバックループで品質を自動的に向上させる。

## 概要

3 つのモードを提供:

```
Mode 1: Design Loop（フロントエンドデザイン）
─────────────────────────────────────────────
User Prompt ─→ Generator ─→ HTML ─→ Evaluator ─→ Score
                  ↑                     │
                  └── feedback ─────────┘
                  (maxIterations回、ベストを採用)

Mode 2: Fullstack Loop（スプリント型フルスタック）
──────────────────────────────────────────────────
User Prompt ─→ Planner ─→ Spec
                            ↓
              ┌─→ Contract Negotiation（Generator ↔ QA）
              │          ↓
              ├─→ Generator ─→ Code ─→ QA Evaluator ─→ Score
              │       ↑                      │
              │       └── feedback ──────────┘
              └── next sprint ──────────────────────────┘

Mode 3: Continuous Loop（V2 スプリントレス）
────────────────────────────────────────────
User Prompt ─→ Planner ─→ Spec
                            ↓
              Generator（全機能を一括ビルド、maxTurns: 100）
                            ↓
              QA Evaluator（全体を1回評価）
                  ↑              │
                  └── feedback ──┘
                  (最大3ラウンド)
```

## クイックスタート

```bash
cd gan-design-loop
npm install
```

### Mode 1: フロントエンドデザインループ

```bash
npm run design "オランダの美術館のウェブサイト"

# オプション指定
npx tsx src/design-loop.ts "モダンなポートフォリオ" 5 7.0
#                                                    ↑  ↑
#                                             回数    閾値（参考値）
```

### Mode 2: フルスタック（スプリント型）

```bash
npm run fullstack "Todoアプリ（React + Express + SQLite）"

npx tsx src/fullstack-loop.ts "ブックマーク管理アプリ" 3 7.0
#                                                      ↑  ↑
#                                          リトライ上限  閾値
```

### Mode 3: V2 スプリントレス（Opus 4.6 向け）

```bash
npm run continuous "DAWアプリ（Web Audio API）"

npx tsx src/continuous-loop.ts "タスク管理アプリ" 3 7.0
#                                                 ↑  ↑
#                                     ラウンド上限  閾値
```

## モード選択ガイド

| モード | 用途 | 推奨モデル | 特徴 |
|--------|------|-----------|------|
| `design` | フロントエンド単体 | Sonnet / Opus | 全イテレーション実行、ベスト採用 |
| `fullstack` | フルスタックアプリ | Sonnet | スプリント分割、契約交渉あり |
| `continuous` | フルスタックアプリ | Opus 4.6 | 一括ビルド、QAは最後に1回 |

**Opus 4.6** はコンテキスト不安がないため `continuous` で長時間安定動作する。
**Sonnet** はスプリント分割で作業を細分化する `fullstack` が適している。

## 主要機能

### 全イテレーション実行 & ベスト採用（Design Loop）

合格で即終了せず、常に指定回数分を回し切る。全イテレーションの中からベストスコアの成果物を `output/best/` にコピーして最終結果とする。

```
イテレーション 1: 7.0/10 🏆 ベスト更新
イテレーション 2: 6.5/10   現在のベスト: 1
イテレーション 3: 8.2/10 🏆 ベスト更新（ピボットで飛躍）
→ output/best/index.html にイテレーション3をコピー
```

### ピボット戦略（Design Loop）

スコアが 3 回連続で停滞（±0.5 以内）すると、ジェネレーターに「全く異なる美的方向性で再設計せよ」というピボット指示が発動する。漸進的改善の限界を突破して、記事のオランダ美術館の例のような創造的飛躍を狙う。

### スプリント契約交渉（Fullstack Loop）

各スプリント開始前に Generator と QA Evaluator が「完了の定義」を交渉する:
1. Generator がテスト基準を提案（15-20 件）
2. QA が精査して追加・修正
3. 合意した契約に基づいてビルド＆評価

### 評価者キャリブレーション

Few-shot 例（スコア 4/6/8 の 3 段階）を評価者プロンプトに埋め込み、採点の一貫性を確保。

### デザイン言語（Fullstack / Continuous）

Planner がカラーパレット、タイポグラフィ、スペーシング等のビジュアルデザイン言語を仕様に含めて出力。テンプレート的なデフォルトを避ける。

### AI 機能の自動組み込み（Fullstack / Continuous）

Planner が仕様に Claude API を活用した AI 機能を自動的に組み込む。Generator はバックエンドプロキシ経由の実装パターンに従う。

### 自動アーカイブ

毎回のループ開始時に前回の `output/` を `archive/YYYYMMDD-HHmmss-<label>/` に自動退避。前回の成果物が上書きされない。

### モデル選択 & 動的コスト計算

```typescript
// src/config.ts でロール別モデルを設定可能
import { DEFAULT_ROLE_MODELS } from "./config.js";
// planner: "claude-sonnet-4-6"
// generator: "claude-sonnet-4-6"
// evaluator: "claude-sonnet-4-6"
// qaEvaluator: "claude-sonnet-4-6"
```

コスト計算は使用モデルの価格テーブルに基づいて自動で行われる。

## 出力構造

### Design Loop

```
output/
├── best/                     # ベストイテレーションのコピー
│   ├── index.html
│   └── evaluation.json
├── iteration-1/
│   ├── index.html            # Generator が生成した HTML
│   └── evaluation.json       # Evaluator のスコア & フィードバック
├── iteration-2/
│   ├── index.html
│   └── evaluation.json
└── ...

archive/
└── 20260406-145012-design/   # 前回の output が自動退避
```

### Fullstack Loop

```
output/fullstack/
├── spec.md                   # 仕様書（人間用）
├── spec.json                 # 仕様書（構造化、デザイン言語含む）
├── app/                      # 生成されたアプリケーション
├── sprint-1/
│   ├── contract-proposal.json    # Generator の契約提案
│   ├── contract-review.json      # QA のレビュー
│   ├── contract-final.json       # 合意済み契約
│   └── qa-evaluation-attempt-1.json
├── sprint-2/
│   └── ...
└── ...
```

### Continuous Loop

```
output/continuous/
├── spec.md
├── spec.json
├── app/                      # 一括ビルドされたアプリ
├── round-1/
│   └── qa-evaluation.json
├── round-2/
│   └── qa-evaluation.json
└── ...
```

## 評価基準

### Design Loop（4 基準、各 1-10）

| 基準 | 重視度 | 内容 |
|------|--------|------|
| デザインの質 | **高** | 色・タイポグラフィ・レイアウトが一体となった統一感 |
| 独創性 | **高** | テンプレートではないカスタム設計の証拠 |
| 技術面 | 中 | タイポグラフィ階層、スペーシング、コントラスト比 |
| 機能性(UX) | 中 | 推測なしにタスクを完了できるか |

### Fullstack / Continuous（4 基準、各 1-10）

| 基準 | 内容 |
|------|------|
| 製品の深み | 仕様要件の充足度、エッジケース対応 |
| 機能性 | ユーザー操作で正しく動作するか |
| ビジュアルデザイン | レイアウト、色使い、プロダクション品質 |
| コード品質 | 構造、命名、コンポーネント分割 |

## ファイル構成

```
src/
├── types.ts                  # 共有型定義（評価スキーマ、SprintContract 等）
├── config.ts                 # モデル設定 & 価格テーブル
├── run-agent.ts              # Claude Agent SDK ラッパー
├── archive.ts                # 出力アーカイブユーティリティ
├── design-loop.ts            # Mode 1: デザインループ
├── fullstack-loop.ts         # Mode 2: スプリント型フルスタック
├── continuous-loop.ts        # Mode 3: V2 スプリントレス
└── prompts/
    ├── generator.ts          # デザイン Generator プロンプト
    ├── evaluator.ts          # デザイン Evaluator プロンプト
    ├── evaluator-examples.ts # 評価 Few-shot 例
    ├── planner.ts            # Planner プロンプト
    ├── qa-evaluator.ts       # QA Evaluator プロンプト
    └── qa-evaluator-examples.ts  # QA 評価 Few-shot 例
```

## 前提条件

- Node.js 20+
- Claude Code CLI（`@anthropic-ai/claude-agent-sdk` が動作する環境）
- Chrome DevTools MCP が有効であること（Evaluator がスクリーンショットを撮影する）

## 参考

- [Anthropic: Advancing AI engineering](https://www.anthropic.com/engineering/advancing-ai-engineering) - 本プロジェクトの元ネタ記事
- [Anthropic: Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Frontend Design Skill](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)
