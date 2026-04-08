---
title: はじめに
description: インストールとクイックスタート
sidebar:
  order: 1
---

## インストール

```bash
git clone https://github.com/naoya5/agentic-design-loop.git
cd agentic-design-loop
npm install
```

### CLIをグローバルに使う（オプション）

```bash
npm run build
npm link
# これで adl コマンドが使えるようになる
```

## 前提条件

- Node.js 20+
- Claude Code CLI（`@anthropic-ai/claude-agent-sdk` が動作する環境）
- Chrome DevTools MCP が有効であること（Evaluator がスクリーンショットを撮影する）

## クイックスタート

### フロントエンドデザインを生成

```bash
adl design "モダンなポートフォリオサイトのランディングページ"
# または
npm run design -- "モダンなポートフォリオサイト"
```

### フルスタックアプリを生成

```bash
adl fullstack "Todoアプリ（React + Express + SQLite）"
```

### V2 一括ビルド（Opus向け）

```bash
adl continuous "DAWアプリ" --model claude-opus-4-6 --threshold 9
```

## 出力先

生成物は `output/` ディレクトリに出力される。前回の出力は `archive/` に自動退避。

```
output/
├── best/               # ベストイテレーション（Design Loop）
├── iteration-1/        # 各イテレーション
├── iteration-2/
└── ...

output/fullstack/       # Fullstack Loop
output/continuous/      # Continuous Loop
```
