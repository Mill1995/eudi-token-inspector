import type { PresentationFlow, RequestedClaim } from "@/domain/types";

/**
 * The overasking layer: transparent, data-driven heuristics that flag data-minimisation smells in a
 * Presentation Request. Rules are editable data (ADR 0005); results are **advisory, never a verdict**.
 */

/** How strongly a fired rule reads — shown beside its rationale. */
export type OveraskingSeverity = "low" | "medium" | "high";

/** The declarative condition that fires a rule: a requested claim's leaf name, optionally gated by flow. */
export interface OveraskingRuleMatch {
  /** Claim leaf names (case-insensitive) that trip the rule, e.g. `["birthdate", "birth_date"]`. */
  readonly claimNames: readonly string[];
  /** When set, the rule fires only in this presentation flow (e.g. a portrait is a smell only remotely). */
  readonly flow?: PresentationFlow;
}

/** One editable overasking heuristic (ADR 0005): metadata plus a declarative match. */
export interface OveraskingRule {
  readonly id: string;
  readonly severity: OveraskingSeverity;
  /** Short headline for the UI. */
  readonly title: string;
  /** Why this is a minimisation smell — always shown, never empty. */
  readonly rationale: string;
  readonly match: OveraskingRuleMatch;
}

/** A rule that fired against a request, with the requested claims that tripped it. */
export interface OveraskingFinding {
  readonly rule: OveraskingRule;
  readonly matchedClaims: readonly RequestedClaim[];
}
