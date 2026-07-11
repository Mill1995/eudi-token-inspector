import { describe, expect, it } from "vitest";

import { decodeSdJwtVc } from "@/domain/sdJwt";
import { getFixture } from "@/fixtures";
import type { SdJwtFixture } from "@/fixtures/types";
import { checkDisclosureIntegrity } from "@/verify/disclosureIntegrity";

const sdJwt = (id: string): SdJwtFixture => getFixture(id) as SdJwtFixture;

describe("checkDisclosureIntegrity binds disclosures to the issuer signature", () => {
  it("passes when every disclosure digest is in the issuer _sd set", async () => {
    const check = await checkDisclosureIntegrity(decodeSdJwtVc(sdJwt("good-issuance").compact));
    expect(check.id).toBe("disclosure-integrity");
    expect(check.outcome).toBe("pass");
  });

  it("fails on a disclosure the issuer never signed", async () => {
    const check = await checkDisclosureIntegrity(
      decodeSdJwtVc(sdJwt("bad-forged-disclosure").compact),
    );
    expect(check.outcome).toBe("fail");
    expect(check.reason).toContain("nationality");
  });

  it("skips a credential that carries no disclosures", async () => {
    const bareIssuer = sdJwt("good-issuance").compact.split("~")[0] + "~";
    const check = await checkDisclosureIntegrity(decodeSdJwtVc(bareIssuer));
    expect(check.outcome).toBe("skip");
  });
});
