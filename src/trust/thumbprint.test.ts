import { describe, expect, it } from "vitest";

import { sdJwtFixtures } from "@/fixtures";
import { jwkThumbprint } from "@/trust/thumbprint";

const ISSUER_JWK = sdJwtFixtures.find((f) => f.id === "good-issuance")!.context.issuerPublicJwk;

describe("jwkThumbprint computes an RFC 7638 SHA-256 thumbprint", () => {
  it("matches the independently computed thumbprint for the fixture issuer key", async () => {
    // Known-good literal from Node's crypto (an implementation independent of WebCrypto).
    await expect(jwkThumbprint(ISSUER_JWK)).resolves.toBe(
      "5oeE7UUx9xmqR9dZF3UU-gtcK4iscqGUijE9a9xPFmQ",
    );
  });

  it("is stable and equal for the same key", async () => {
    const first = await jwkThumbprint(ISSUER_JWK);
    const second = await jwkThumbprint({ ...ISSUER_JWK });
    expect(first).toBe(second);
  });

  it("differs for a different key", async () => {
    const other: JsonWebKey = { ...ISSUER_JWK, x: "AAAAVN_egN0g1o5smTv-BmpXPlOo_rmndbp06kN-T4g" };
    expect(await jwkThumbprint(other)).not.toBe(await jwkThumbprint(ISSUER_JWK));
  });

  it("throws on a key type it cannot canonicalize", async () => {
    await expect(jwkThumbprint({ kty: "unknown" } as JsonWebKey)).rejects.toThrow(/kty/i);
  });
});
