import { describe, expect, it } from "vitest";

import { decodeSdJwtVc } from "@/domain/sdJwt";
import { getFixture } from "@/fixtures";
import type { SdJwtFixture } from "@/fixtures/types";
import { checkIssuerSignature } from "@/verify/issuerSignature";

const fixture = (id: string): SdJwtFixture => getFixture(id) as SdJwtFixture;

describe("checkIssuerSignature", () => {
  it("passes a valid EdDSA issuer signature against the resolved key", async () => {
    const f = fixture("good-issuance");
    const check = await checkIssuerSignature(decodeSdJwtVc(f.compact), f.context.issuerPublicJwk);
    expect(check.id).toBe("issuer-signature");
    expect(check.outcome).toBe("pass");
  });

  it("fails when a signature byte is flipped", async () => {
    const f = fixture("bad-tampered-issuer-sig");
    const check = await checkIssuerSignature(decodeSdJwtVc(f.compact), f.context.issuerPublicJwk);
    expect(check.outcome).toBe("fail");
  });

  it("skips when no issuer key is resolved", async () => {
    const f = fixture("good-issuance");
    const check = await checkIssuerSignature(decodeSdJwtVc(f.compact), undefined);
    expect(check.outcome).toBe("skip");
    expect(check.reason).toMatch(/paste/i);
  });
});
