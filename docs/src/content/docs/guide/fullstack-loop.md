---
title: Fullstack Loop
description: スプリント型フルスタックアプリ生成
sidebar:
  order: 3
---

## 概要

Planner → Generator → QA Evaluator の3エージェント構成。スプリント単位で段階的にアプリを構築し、各スプリントでQAが実際にブラウザでテストする。

## フロー

```
Planner（仕様 + デザイン言語作成）
  ↓
[各スプリント]
  ├── 契約交渉（Generator ↔ QA: テスト基準を合意）
  ├── Generator（実装 + git commit）
  └── QA Evaluator（ブラウザ操作テスト + 4基準採点）
        → 不合格: フィードバック → Generator再実装
        → 合格: 次のスプリントへ
```

## スプリント契約交渉

各スプリント開始前に Generator と QA が「完了の定義」を交渉する：

1. Generator がテスト基準を提案（15-20件）
2. QA が精査して追加・修正
3. 合意した契約に基づいてビルド & 評価

## オプション

```bash
adl fullstack "プロンプト" \
  --retries 3 \
  --threshold 7.0 \
  --model claude-sonnet-4-6
```
