---
title: モデル設定
description: モデル選択と価格テーブル
sidebar:
  order: 4
---

## モデル価格テーブル

```typescript
// src/config.ts
export const MODEL_PRICING = {
  "claude-opus-4-6":           { inputPerMillion: 15,   outputPerMillion: 75  },
  "claude-sonnet-4-6":         { inputPerMillion: 3,    outputPerMillion: 15  },
  "claude-haiku-4-5-20251001": { inputPerMillion: 0.80, outputPerMillion: 4   },
};
```

## モデル選択ガイド

| モード | 推奨モデル | 理由 |
|--------|-----------|------|
| design | Sonnet / Opus | デザイン品質はモデル性能に比例 |
| fullstack | Sonnet | スプリント分割でコンテキスト管理 |
| continuous | Opus 4.6 | 長時間セッションで安定動作 |

## 実験結果のコスト

| 実験 | モデル | ラウンド | スコア | コスト |
|------|--------|---------|--------|--------|
| 美術館サイト | Sonnet | 1 | 7.0 | $1.17 |
| 寿司レストラン | Sonnet | 5 | 8.0 | $2.89 |
| 読書管理アプリ | Sonnet | 3 | 8.8 | $1.15 |
| 家計簿アプリ | Sonnet | 1 | 7.5 | $0.26 |
| TaskFlow | Opus | 3 | 7.3 | $10.55 |
