import { describe, expect, it } from "vitest";

import { sdJwtFixtures } from "@/fixtures";
import { parseTrustAnchors } from "@/trust/importAnchors";

const issuerKey = sdJwtFixtures.find((f) => f.id === "good-issuance")!.context.issuerPublicJwk;

describe("parseTrustAnchors imports pasted keys as trust anchors", () => {
  it("reads every key of a pasted JWKS", () => {
    const jwks = JSON.stringify({ keys: [issuerKey, { ...issuerKey, kid: "second" }] });
    const anchors = parseTrustAnchors(jwks);
    expect(anchors).toHaveLength(2);
    expect(anchors[0]?.publicJwk.kty).toBe("OKP");
    expect(anchors[0]?.source).toMatch(/pasted/i);
  });

  it("reads a bare JWK", () => {
    const anchors = parseTrustAnchors(JSON.stringify(issuerKey));
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.publicJwk.kty).toBe("OKP");
  });

  it("returns nothing for input that carries no key", () => {
    expect(parseTrustAnchors("not json")).toEqual([]);
    expect(parseTrustAnchors(JSON.stringify({ hello: "world" }))).toEqual([]);
    expect(parseTrustAnchors("")).toEqual([]);
  });
});
