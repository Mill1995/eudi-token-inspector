import { describe, expect, it } from "vitest";

import { resolveDisclosures } from "@/domain/disclosures";
import { decodeSdJwtVc } from "@/domain/sdJwt";
import { getFixture } from "@/fixtures";
import type { SdJwtFixture } from "@/fixtures/types";

const sdJwt = (id: string): SdJwtFixture => getFixture(id) as SdJwtFixture;

describe("resolveDisclosures reconstructs the plaintext claim set", () => {
  it("substitutes every disclosed value and strips the _sd machinery", async () => {
    const credential = decodeSdJwtVc(sdJwt("good-issuance").compact);
    const { claims, unmatched } = await resolveDisclosures(credential);

    expect(unmatched).toHaveLength(0);
    expect(claims["given_name"]).toBe("Ada");
    expect(claims["family_name"]).toBe("Lovelace");
    expect(claims["birthdate"]).toBe("1815-12-10");
    expect(claims["_sd"]).toBeUndefined();
    expect(claims["_sd_alg"]).toBeUndefined();
    expect(claims["vct"]).toBe("urn:eudi:pid:1");
  });

  it("reports a disclosure that no issuer-signed _sd digest references", async () => {
    const credential = decodeSdJwtVc(sdJwt("bad-forged-disclosure").compact);
    const { claims, unmatched } = await resolveDisclosures(credential);

    expect(unmatched).toHaveLength(1);
    expect(unmatched[0]?.claimName).toBe("nationality");
    // The forged claim is never woven into the resolved payload.
    expect(claims["nationality"]).toBeUndefined();
  });
});
