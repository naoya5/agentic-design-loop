/**
 * モデル設定と価格テーブル
 */

export type ModelId =
  | "claude-opus-4-6"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5-20251001";

export interface ModelPricing {
  inputPerMillion: number;  // $/1M input tokens
  outputPerMillion: number; // $/1M output tokens
  label: string;
}

export const MODEL_PRICING: Record<ModelId, ModelPricing> = {
  "claude-opus-4-6": {
    inputPerMillion: 15,
    outputPerMillion: 75,
    label: "Opus 4.6",
  },
  "claude-sonnet-4-6": {
    inputPerMillion: 3,
    outputPerMillion: 15,
    label: "Sonnet 4.6",
  },
  "claude-haiku-4-5-20251001": {
    inputPerMillion: 0.80,
    outputPerMillion: 4,
    label: "Haiku 4.5",
  },
};

/** ロール別のデフォルトモデル設定 */
export interface RoleModelConfig {
  planner: ModelId;
  generator: ModelId;
  evaluator: ModelId;
  qaEvaluator: ModelId;
}

export const DEFAULT_ROLE_MODELS: RoleModelConfig = {
  planner: "claude-sonnet-4-6",
  generator: "claude-sonnet-4-6",
  evaluator: "claude-sonnet-4-6",
  qaEvaluator: "claude-sonnet-4-6",
};

/**
 * モデルIDからコストを計算する
 */
export function calculateCost(
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = MODEL_PRICING[modelId as ModelId];
  if (!pricing) {
    // 不明なモデルの場合はSonnet価格をフォールバック
    const fallback = MODEL_PRICING["claude-sonnet-4-6"];
    return (
      (inputTokens / 1_000_000) * fallback.inputPerMillion +
      (outputTokens / 1_000_000) * fallback.outputPerMillion
    );
  }
  return (
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion
  );
}
