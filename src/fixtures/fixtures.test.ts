import { describe, expect, it } from "vitest";

import { fixtures, getFixture, openId4VpFixtures, sdJwtFixtures } from "@/fixtures";
import type { OpenId4VpFixture, SdJwtFixture } from "@/fixtures/types";

function base64UrlToBytes(segment: string): Uint8Array {
  const base64 = segment.replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJson(segment: string): unknown {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

/** The KB-JWT payload of a presentation (its last `~`-segment, a compact JWS). */
function kbPayload(compact: string): Record<string, unknown> {
  const kb = compact.split("~").at(-1) ?? "";
  return decodeJson(kb.split(".")[1] ?? "") as Record<string, unknown>;
}

/** Decode the `[salt, key, value]` disclosures of a compact SD-JWT VC into a key→value map. */
function disclosedClaims(compact: string): Record<string, unknown> {
  const claims: Record<string, unknown> = {};
  for (const segment of compact.split("~").slice(1)) {
    // Skip the empty trailing segment (issuance) and the dotted KB-JWT segment (presentation);
    // a disclosure is a single base64url token.
    if (segment === "" || segment.includes(".")) continue;
    const decoded = decodeJson(segment);
    if (Array.isArray(decoded) && decoded.length === 3) claims[String(decoded[1])] = decoded[2];
  }
  return claims;
}

const sdJwt = (id: string): SdJwtFixture => getFixture(id) as SdJwtFixture;
const oid4vp = (id: string): OpenId4VpFixture => getFixture(id) as OpenId4VpFixture;

const presentations = sdJwtFixtures.filter((f) => f.kind === "sd-jwt-vc-presentation");
const issuances = sdJwtFixtures.filter((f) => f.kind === "sd-jwt-vc-issuance");

describe("fixture matrix", () => {
  it("loads every committed vector with unique ids", () => {
    expect(fixtures).toHaveLength(9);
    expect(new Set(fixtures.map((f) => f.id)).size).toBe(fixtures.length);
  });

  it("exposes exactly one intended failure per negative SD-JWT fixture", () => {
    for (const fixture of sdJwtFixtures) {
      const failures = Object.values(fixture.expect).filter((outcome) => outcome === "fail");
      expect(failures, fixture.id).toHaveLength(fixture.id.startsWith("bad-") ? 1 : 0);
    }
  });
});

describe("SD-JWT VC compact shape", () => {
  it("ends issuances with a trailing '~' and no KB-JWT", () => {
    for (const fixture of issuances) expect(fixture.compact.endsWith("~"), fixture.id).toBe(true);
  });

  it("ends presentations with a 3-segment KB-JWT", () => {
    for (const fixture of presentations) {
      const kb = fixture.compact.split("~").at(-1) ?? "";
      expect(kb.split("."), fixture.id).toHaveLength(3);
    }
  });
});

describe("good-issuance decodes to the expected claims", () => {
  it("resolves all three disclosures to their exact values", () => {
    expect(disclosedClaims(sdJwt("good-issuance").compact)).toEqual({
      given_name: "Ada",
      family_name: "Lovelace",
      birthdate: "1815-12-10",
    });
  });
});

describe("bad-sd-hash-mismatch breaks the disclosure seal", () => {
  it("reuses the good KB-JWT verbatim but shows fewer disclosures", () => {
    const good = sdJwt("good-presentation");
    const bad = sdJwt("bad-sd-hash-mismatch");
    // Same sealed sd_hash (same KB-JWT) over a strictly smaller shown set → a genuine mismatch.
    expect(kbPayload(bad.compact)["sd_hash"]).toBe(kbPayload(good.compact)["sd_hash"]);
    expect(Object.keys(disclosedClaims(bad.compact)).length).toBeLessThan(
      Object.keys(disclosedClaims(good.compact)).length,
    );
  });
});

describe("KB-JWT binding matches the expected aud/nonce only when the fixture expects it", () => {
  it("agrees with the audience expectation", () => {
    for (const fixture of presentations) {
      const bound = kbPayload(fixture.compact)["aud"] === fixture.context.expectedAudience;
      expect(bound, fixture.id).toBe(fixture.expect.audience === "pass");
    }
  });

  it("agrees with the nonce expectation", () => {
    for (const fixture of presentations) {
      const bound = kbPayload(fixture.compact)["nonce"] === fixture.context.expectedNonce;
      expect(bound, fixture.id).toBe(fixture.expect.nonce === "pass");
    }
  });
});

describe("OpenID4VP request vectors", () => {
  it("cover both DCQL and Presentation Exchange shapes", () => {
    expect(openId4VpFixtures).toHaveLength(2);
    expect("dcql_query" in oid4vp("overasking-request-dcql").request).toBe(true);
    expect("presentation_definition" in oid4vp("request-pex").request).toBe(true);
  });

  it("flags the overasking request and clears the justified one", () => {
    expect(oid4vp("overasking-request-dcql").expect.overaskingRuleIds.length).toBeGreaterThan(0);
    expect(oid4vp("request-pex").expect.overaskingRuleIds).toHaveLength(0);
  });
});
