import { describe, expect, it } from "vitest";

import { decodeSdJwtVc } from "@/domain/sdJwt";
import type { Credential } from "@/domain/types";
import { getFixture } from "@/fixtures";
import type { SdJwtFixture } from "@/fixtures/types";

const compact = (id: string): string => (getFixture(id) as SdJwtFixture).compact;

/** Build a claim-name → value map from a decoded credential's object-property disclosures. */
function claimMap(credential: Credential): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  for (const disclosure of credential.disclosures) {
    if (disclosure.claimName !== undefined) map[disclosure.claimName] = disclosure.value;
  }
  return map;
}

describe("decodeSdJwtVc — issuance", () => {
  const credential = decodeSdJwtVc(compact("good-issuance"));

  it("decodes the issuer JWT header and payload", () => {
    expect(credential.issuerJwt.header["alg"]).toBe("EdDSA");
    expect(credential.issuerJwt.header["typ"]).toBe("dc+sd-jwt");
    expect(credential.issuerJwt.payload["iss"]).toBe(
      "did:key:z6Mkt38FKoX7fqgko8aUXabLGbXDQhyHxSWpfN3N9cSgqyBM",
    );
    expect(credential.issuerJwt.payload["vct"]).toBe("urn:eudi:pid:1");
  });

  it("resolves every disclosure to its exact claim value", () => {
    expect(claimMap(credential)).toEqual({
      given_name: "Ada",
      family_name: "Lovelace",
      birthdate: "1815-12-10",
    });
  });

  it("carries no KB-JWT", () => {
    expect(credential.kbJwt).toBeUndefined();
  });

  it("exposes the issuer signing input and raw signature bytes", () => {
    const [header, payload] = compact("good-issuance").split("~")[0]!.split(".");
    expect(credential.issuerJwt.signingInput).toBe(`${header}.${payload}`);
    expect(credential.issuerJwt.signature.byteLength).toBeGreaterThan(0);
  });
});

describe("decodeSdJwtVc — presentation", () => {
  const credential = decodeSdJwtVc(compact("good-presentation"));

  it("decodes the KB-JWT header and bound claims", () => {
    expect(credential.kbJwt).toBeDefined();
    expect(credential.kbJwt?.jws.header["alg"]).toBe("ES256");
    expect(credential.kbJwt?.jws.header["typ"]).toBe("kb+jwt");
    expect(credential.kbJwt?.aud).toBe("https://verifier.eudi.example");
    expect(credential.kbJwt?.nonce).toBe("sU_KScuserCj-7bHIZ3HkP6isRTlGid56Q__veqWP7A");
    expect(credential.kbJwt?.sdHash).toBe("pFD08eRGY9VlDvpcGPaxO-FcuJCwuSVOjW1niGXUg_M");
  });

  it("exposes the disclosure-hash input as everything up to and including the last '~'", () => {
    const full = compact("good-presentation");
    expect(credential.sdHashInput).toBe(full.slice(0, full.lastIndexOf("~") + 1));
  });
});
