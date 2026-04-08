---
title: CLI リファレンス
description: adl コマンドの全オプション
sidebar:
  order: 1
---

## インストール

```bash
npm run build && npm link
```

## コマンド

### `adl design`

フロントエンドデザインループを実行。

```bash
adl design <prompt> [options]
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--iterations <n>` | 10 | イテレーション回数 |
| `--threshold <n>` | 7.0 | 合格閾値 |
| `--model <id>` | claude-sonnet-4-6 | 使用モデル |
| `--early-exit` | false | 合格で即終了 |

### `adl fullstack`

スプリント型フルスタックループを実行。

```bash
adl fullstack <prompt> [options]
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--retries <n>` | 3 | スプリントリトライ上限 |
| `--threshold <n>` | 7.0 | 合格閾値 |
| `--model <id>` | claude-sonnet-4-6 | 使用モデル |

### `adl continuous`

V2 スプリントレス一括ビルドを実行。

```bash
adl continuous <prompt> [options]
```

| オプション | デフォルト | 説明 |
|-----------|-----------|------|
| `--rounds <n>` | 3 | ビルドラウンド上限 |
| `--threshold <n>` | 7.0 | 合格閾値 |
| `--model <id>` | claude-sonnet-4-6 | 使用モデル |

## モデルID一覧

| モデル | ID | コスト（Input/Output per 1M） |
|--------|-----|------|
| Opus 4.6 | `claude-opus-4-6` | $15 / $75 |
| Sonnet 4.6 | `claude-sonnet-4-6` | $3 / $15 |
| Haiku 4.5 | `claude-haiku-4-5-20251001` | $0.80 / $4 |
