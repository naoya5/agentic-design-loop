# CLAUDE.md

## プロジェクト概要

GAN的マルチエージェント設計ループ。Claude Agent SDK を使い、Generator（生成）と Evaluator（評価）を分離したフィードバックループでフロントエンドデザインとフルスタックアプリを自動生成する。

## 技術スタック

- TypeScript (ESM)
- Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- Chrome DevTools MCP（スクリーンショット評価）

## 主要ファイル

- `src/cli.ts` — 統合CLIエントリーポイント
- `src/design-loop.ts` — フロントエンドデザインループ
- `src/fullstack-loop.ts` — スプリント型フルスタック
- `src/continuous-loop.ts` — V2 スプリントレス
- `src/config.ts` — モデル設定・価格テーブル
- `src/prompts/` — 各エージェントのシステムプロンプト

## コマンド

```bash
npm run design -- "プロンプト"      # デザインループ
npm run fullstack -- "プロンプト"   # フルスタック
npm run continuous -- "プロンプト"  # V2スプリントレス
npm run build                       # TypeScriptビルド
npm run typecheck                   # 型チェック
```

## 注意点

- `output/` と `archive/` は .gitignore で除外
- Chrome DevTools MCP が接続されていないと Evaluator がスクリーンショットを取れない
- QA Evaluator の maxTurns は 25 が適切（15だと足りない）
