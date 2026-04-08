# サンプルプロンプト集

## Phase 1: フロントエンドデザインループ

### シンプルなもの（入門向け）

```bash
npx tsx src/design-loop.ts "ミニマルなプロフィールカード。写真・名前・肩書き・SNSリンク付き"
```

```bash
npx tsx src/design-loop.ts "ダークテーマの価格表ページ。3プラン比較"
```

### やや複雑（中級）

```bash
npx tsx src/design-loop.ts "クリエイティブエージェンシーのランディングページ。ヒーローセクション、実績紹介、チーム紹介、お問い合わせフォーム付き"
```

```bash
npx tsx src/design-loop.ts "AIスタートアップのプロダクトページ。グラデーション背景、機能紹介カード、デモ動画セクション、FAQ"
```

### チャレンジ（上級）

```bash
npx tsx src/design-loop.ts "日本の伝統とモダンデザインを融合したレストランのウェブサイト。和の色彩、縦書きテキスト、メニュー、予約フォーム"
```

```bash
npx tsx src/design-loop.ts "インタラクティブなデータダッシュボード。Chart.jsでグラフ表示、KPIカード、サイドバーナビゲーション"
```

## Phase 2: フルスタック3エージェント

### シンプル（入門向け）

```bash
npx tsx src/fullstack-loop.ts "シンプルなTodoアプリ。React + Express + SQLite"
```

### 中級

```bash
npx tsx src/fullstack-loop.ts "ブックマーク管理アプリ。タグ付け・検索・カテゴリ分類機能付き。React + Express"
```

### 上級

```bash
npx tsx src/fullstack-loop.ts "チームタスク管理ボード（カンバン）。ドラッグ&ドロップ、ユーザーアサイン、期限管理。React + Express + SQLite"
```

## パラメータ調整

```bash
# イテレーション数を5回に制限
npx tsx src/design-loop.ts "ランディングページ" 5

# 閾値を6.0に下げる（通りやすくなる）
npx tsx src/design-loop.ts "ランディングページ" 10 6.0

# フルスタック: リトライ2回まで、閾値6.5
npx tsx src/fullstack-loop.ts "Todoアプリ" 2 6.5
```
