export const GENERATOR_SYSTEM_PROMPT = `あなたはフロントエンドデザインの専門家です。
ユーザーのプロンプトに基づいて、高品質で独創的なウェブページを生成します。

## 出力ルール

1. **単一のHTMLファイル**として出力すること（CSS・JSはすべてインラインで含める）
2. 外部CDNの利用はOK（Google Fonts, Font Awesome, Tailwind CDN等）
3. レスポンシブデザインを意識すること
4. ダミーデータは具体的でリアルな内容にすること

## デザイン品質基準

以下の4基準で評価されることを意識して制作すること：

### 1. デザインの質
- 色・タイポグラフィ・レイアウト・画像が一体となって統一感のある印象を与えること
- 全体として独特の雰囲気と個性を生み出すこと

### 2. 独創性
- テンプレートのようなデフォルト設定やありきたりなパターンを避けること
- 人間のデザイナーが意図的に行った独創的な選択を感じられること
- NG例：変更されていない既存コンポーネント、白地にホワイト系グラデーション等の「AIっぽい」パターン

### 3. 技術面
- タイポグラフィの階層構造を明確にすること
- スペーシングの一貫性を保つこと
- 色の調和とコントラスト比を適切にすること

### 4. 機能性（UX）
- ユーザーが推測することなくタスクを完了できること
- 直感的な操作で迷わない設計にすること

## 作業手順

1. 指定されたパスにHTMLファイルをWriteツールで書き出す
2. フィードバックがある場合は、前回のHTMLを読み取り、指摘を反映して改善する
3. 改善時は「維持すべき点」を壊さないよう注意する
`;

export function buildGeneratorPrompt(
  userPrompt: string,
  iteration: number,
  outputPath: string,
  previousEvaluation?: {
    criticalIssues: string[];
    strengths: string[];
    overallFeedback: string;
    scores: Record<string, { score: number; feedback: string }>;
  },
  previousHtmlPath?: string,
  isStagnant: boolean = false
): string {
  if (iteration === 1) {
    return `以下のプロンプトに基づいてウェブページを作成してください。

## プロンプト
${userPrompt}

## 出力先
${outputPath} にHTMLファイルを書き出してください。`;
  }

  if (isStagnant && iteration > 1) {
    return `前回のデザインを全く新しい方向性で再設計してください。

## 元のプロンプト
${userPrompt}

## 前回の評価結果
${JSON.stringify(previousEvaluation, null, 2)}

## ⚡ ピボット指示

スコアが停滞しています。漸進的な改善では限界に達しました。
以下の方針で、全く異なる美的方向性で再設計してください：

1. 現在のアプローチを完全に破棄すること
2. 色彩、レイアウト構造、タイポグラフィを根本から変えること
3. 前回とは異なるデザインコンセプト（例：ミニマリスト→マキシマリスト、ダーク→ライト、幾何学→有機的）を採用すること
4. 「維持すべき点」の中で最も評価の高かった要素のみを保持し、それ以外は自由に再構築すること

大胆な美的リスクを取ってください。最高のデザインは美術館級です。

## 参考（前回の良い点）
${previousEvaluation!.strengths.map((s) => `   - ${s}`).join("\n")}

## 出力先
再設計したHTMLを ${outputPath} に書き出してください。`;
  }

  return `前回のデザインを改善してください。

## 元のプロンプト
${userPrompt}

## 前回の評価結果
${JSON.stringify(previousEvaluation, null, 2)}

## 指示
1. まず前回のHTML（${previousHtmlPath}）を読み取ってください
2. 以下の「修正すべき点」を重点的に改善してください：
${previousEvaluation!.criticalIssues.map((i) => `   - ${i}`).join("\n")}

3. 以下の「良い点」は維持してください：
${previousEvaluation!.strengths.map((s) => `   - ${s}`).join("\n")}

4. 評価者からのフィードバック：
${previousEvaluation!.overallFeedback}

## 出力先
改善したHTMLを ${outputPath} に書き出してください。`;
}
