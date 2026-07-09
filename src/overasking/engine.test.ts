import { describe, expect, it } from "vitest";

import { decodePresentationRequest } from "@/domain/presentationRequest";
import { openId4VpFixtures } from "@/fixtures";
import { evaluateOverasking } from "@/overasking/engine";
import { DEFAULT_OVERASKING_RULES } from "@/overasking/rules";

function firedIds(fixtureId: string, rules = DEFAULT_OVERASKING_RULES): string[] {
  const fixture = openId4VpFixtures.find((f) => f.id === fixtureId);
  if (fixture === undefined) throw new Error(`no OpenID4VP fixture "${fixtureId}"`);
  const request = decodePresentationRequest(fixture.request as Record<string, unknown>);
  return evaluateOverasking(request, rules)
    .map((finding) => finding.rule.id)
    .toSorted();
}

describe("evaluateOverasking reproduces each fixture's declared expectation", () => {
  for (const fixture of openId4VpFixtures) {
    it(`fires exactly the expected rules for "${fixture.id}"`, () => {
      const expected = fixture.expect.overaskingRuleIds.toSorted();
      expect(firedIds(fixture.id)).toEqual(expected);
    });
  }
});

describe("evaluateOverasking annotates each finding", () => {
  const request = decodePresentationRequest(
    openId4VpFixtures.find((f) => f.id === "overasking-request-dcql")!.request as Record<
      string,
      unknown
    >,
  );
  const findings = evaluateOverasking(request, DEFAULT_OVERASKING_RULES);

  it("carries a severity, a non-empty rationale, and the claims that tripped it", () => {
    expect(findings).toHaveLength(3);
    for (const finding of findings) {
      expect(finding.rule.severity).toMatch(/^(low|medium|high)$/);
      expect(finding.rule.rationale.length).toBeGreaterThan(0);
      expect(finding.matchedClaims.length).toBeGreaterThan(0);
    }
  });
});

describe("evaluateOverasking honours the rule set it is given (in-session toggle)", () => {
  const request = decodePresentationRequest(
    openId4VpFixtures.find((f) => f.id === "overasking-request-dcql")!.request as Record<
      string,
      unknown
    >,
  );

  it("drops a rule's finding when that rule is disabled", () => {
    const withoutPortrait = DEFAULT_OVERASKING_RULES.filter(
      (rule) => rule.id !== "portrait-in-remote-flow",
    );
    const ids = evaluateOverasking(request, withoutPortrait).map((finding) => finding.rule.id);
    expect(ids).not.toContain("portrait-in-remote-flow");
    expect(ids).toHaveLength(2);
  });
});
