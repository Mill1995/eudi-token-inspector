import { describe, expect, it } from "vitest";

import { decodeSdJwtVc } from "@/domain/sdJwt";
import type { CheckId } from "@/domain/types";
import { sdJwtFixtures } from "@/fixtures";
import type { VerifyExpectation } from "@/fixtures/types";
import { verifyCredential } from "@/verify/verifyCredential";

/** Map each declarative expectation field to the check id the verifier produces. */
const FIELD_TO_CHECK: Record<keyof VerifyExpectation, CheckId> = {
  issuerSignature: "issuer-signature",
  keyBindingSignature: "key-binding-signature",
  sdHash: "sd-hash",
  temporal: "temporal",
  audience: "audience",
  nonce: "nonce",
};

describe("verifyCredential reproduces the fixture matrix", () => {
  for (const fixture of sdJwtFixtures) {
    it(`matches every expected outcome for "${fixture.id}"`, async () => {
      const result = await verifyCredential({
        credential: decodeSdJwtVc(fixture.compact),
        nowSeconds: fixture.context.verificationTimeSeconds,
        issuerKey: fixture.context.issuerPublicJwk,
        expectedAudience: fixture.context.expectedAudience,
        expectedNonce: fixture.context.expectedNonce,
      });
      for (const [field, checkId] of Object.entries(FIELD_TO_CHECK)) {
        const expected = fixture.expect[field as keyof VerifyExpectation];
        expect(result.byId[checkId].outcome, `${fixture.id}/${checkId}`).toBe(expected);
      }
    });
  }
});

describe("verifyCredential — missing key reads as skip, never fail (DoD)", () => {
  it("skips the issuer signature when no key is resolved", async () => {
    const good = sdJwtFixtures.find((f) => f.id === "good-issuance")!;
    const result = await verifyCredential({
      credential: decodeSdJwtVc(good.compact),
      nowSeconds: good.context.verificationTimeSeconds,
    });
    expect(result.byId["issuer-signature"].outcome).toBe("skip");
  });

  it("returns the six checks in a stable order", async () => {
    const good = sdJwtFixtures.find((f) => f.id === "good-presentation")!;
    const result = await verifyCredential({
      credential: decodeSdJwtVc(good.compact),
      nowSeconds: good.context.verificationTimeSeconds,
      issuerKey: good.context.issuerPublicJwk,
      expectedAudience: good.context.expectedAudience,
      expectedNonce: good.context.expectedNonce,
    });
    expect(result.checks.map((c) => c.id)).toEqual([
      "issuer-signature",
      "key-binding-signature",
      "sd-hash",
      "temporal",
      "audience",
      "nonce",
    ]);
  });
});
