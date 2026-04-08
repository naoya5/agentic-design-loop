---
title: Continuous Loop
description: V2 スプリントレス一括ビルド（Opus 4.6向け）
sidebar:
  order: 4
---

## 概要

記事のV2ハーネスに対応。Opus 4.6 のコンテキスト安定性を前提に、スプリント分割を廃止。Generator が全機能を1セッション（maxTurns: 100）で一括ビルドし、QA Evaluator が最後に1回だけ評価する。

## Fullstack Loop との違い

| | Fullstack | Continuous |
|---|---|---|
| 構造 | スプリント分割あり | 一括ビルド |
| Generator | スプリントごと（maxTurns: 30） | 全機能1セッション（maxTurns: 100） |
| QA評価 | 各スプリント後 | 全体完了後に1回 |
| 契約交渉 | あり | なし |
| 推奨モデル | Sonnet | Opus 4.6 |

## オプション

```bash
adl continuous "プロンプト" \
  --rounds 3 \
  --threshold 9.0 \
  --model claude-opus-4-6
```
