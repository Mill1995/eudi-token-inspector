import type { PresentationRequest, RequestedClaim } from "@/domain/types";
import type { OveraskingFinding, OveraskingRule } from "@/overasking/types";

function leafName(claim: RequestedClaim): string | undefined {
  return claim.path.at(-1)?.toLowerCase();
}

/**
 * Run the given overasking rules against a Presentation Request and return the ones that fire, each
 * with the requested claims that tripped it. A rule fires when a requested claim's leaf name matches
 * one of its `claimNames` (case-insensitive) and its optional `flow` gate matches the request's flow.
 * Advisory only (ADR 0005) — the result is never a pass/fail verdict. Pass a filtered rule set to
 * honour an in-session toggle.
 */
export function evaluateOverasking(
  request: PresentationRequest,
  rules: readonly OveraskingRule[],
): OveraskingFinding[] {
  const claims = request.credentials.flatMap((credential) => credential.claims);
  const findings: OveraskingFinding[] = [];
  for (const rule of rules) {
    if (rule.match.flow !== undefined && rule.match.flow !== request.flow) continue;
    const names = new Set(rule.match.claimNames.map((name) => name.toLowerCase()));
    const matchedClaims = claims.filter((claim) => {
      const leaf = leafName(claim);
      return leaf !== undefined && names.has(leaf);
    });
    if (matchedClaims.length > 0) findings.push({ rule, matchedClaims });
  }
  return findings;
}
