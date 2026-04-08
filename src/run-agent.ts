import { query } from "@anthropic-ai/claude-agent-sdk";
import { calculateCost } from "./config.js";
import type { AgentResult } from "./types.js";

export interface RunAgentOptions {
  allowedTools?: string[];
  permissionMode?: "default" | "acceptEdits" | "bypassPermissions";
  systemPrompt?: string;
  maxTurns?: number;
  cwd?: string;
  model?: string;
}

/**
 * Claude Agent SDK の query() をラップしたユーティリティ。
 * エージェントを実行し、最終結果とコストを返す。
 */
export async function runAgent(
  prompt: string,
  options: RunAgentOptions = {}
): Promise<AgentResult> {
  const {
    allowedTools = ["Read", "Glob", "Bash", "Write", "Edit"],
    permissionMode = "acceptEdits",
    systemPrompt,
    maxTurns,
    cwd,
    model,
  } = options;

  let result = "";
  let cost: number | undefined;

  for await (const msg of query({
    prompt,
    options: {
      allowedTools,
      permissionMode,
      systemPrompt,
      maxTurns,
      cwd,
      model,
    },
  })) {
    switch (msg.type) {
      case "assistant": {
        const texts = msg.message.content
          .filter((c: { type: string }) => c.type === "text")
          .map((c: { type: string; text?: string }) => c.text ?? "")
          .join("");
        if (texts) console.log("  [Agent]", texts.slice(0, 200));
        break;
      }
      case "result":
        if (msg.subtype === "success") {
          result = msg.result;
          const usage = msg.usage;
          if (usage) {
            cost = calculateCost(
              model ?? "claude-sonnet-4-6",
              usage.input_tokens,
              usage.output_tokens
            );
          }
        } else {
          console.error(`  [Agent] ⚠️ 非成功終了: ${msg.subtype}`);
          result = `ERROR: ${msg.subtype}`;
        }
        break;
    }
  }

  return { result, cost };
}
