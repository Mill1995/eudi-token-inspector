import rawRules from "@/overasking/rules.json";
import type { OveraskingRule } from "@/overasking/types";

const SEVERITIES = new Set<string>(["low", "medium", "high"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrow one entry of `rules.json` to an {@link OveraskingRule}, failing fast on malformed data. */
function parseRule(raw: unknown): OveraskingRule {
  if (!isRecord(raw)) throw new Error("overasking rule is not an object");
  const { id, severity, title, rationale, match } = raw;
  if (typeof id !== "string" || typeof title !== "string" || typeof rationale !== "string") {
    throw new Error(`malformed overasking rule (id/title/rationale): ${JSON.stringify(raw)}`);
  }
  if (typeof severity !== "string" || !SEVERITIES.has(severity)) {
    throw new Error(`overasking rule "${id}" has invalid severity "${String(severity)}"`);
  }
  if (!isRecord(match) || !Array.isArray(match["claimNames"])) {
    throw new Error(`overasking rule "${id}" has no claimNames match`);
  }
  return raw as unknown as OveraskingRule;
}

/** The shipped overasking heuristics (ADR 0005), editable in `rules.json`. */
export const DEFAULT_OVERASKING_RULES: readonly OveraskingRule[] = rawRules.map(parseRule);
