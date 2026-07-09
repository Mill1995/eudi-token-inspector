import { describe, expect, it } from "vitest";

import { decodeSdJwtVc } from "@/domain/sdJwt";
import { sdJwtFixtures } from "@/fixtures";
import { checkIssuerTrust } from "@/trust/checkIssuer";
import { CURATED_ANCHORS } from "@/trust/snapshot";
import type { TrustAnchor } from "@/trust/types";

const good = sdJwtFixtures.find((f) => f.id === "good-issuance")!;
const credential = decodeSdJwtVc(good.compact);
const issuerKey = good.context.issuerPublicJwk;

describe("checkIssuerTrust compares an issuer against the trust anchors (informational)", () => {
  it("matches the curated snapshot by issuer id", async () => {
    const result = await checkIssuerTrust({ credential, anchors: CURATED_ANCHORS });
    expect(result.status).toBe("trusted");
    expect(result.basis).toBe("issuer-id");
    expect(result.anchor?.label).toBe("EUDI Inspector reference issuer");
    expect(result.issuer).toBe("did:key:z6Mkt38FKoX7fqgko8aUXabLGbXDQhyHxSWpfN3N9cSgqyBM");
  });

  it("reports unknown when no anchor covers the issuer", async () => {
    const result = await checkIssuerTrust({ credential, anchors: [] });
    expect(result.status).toBe("unknown");
    expect(result.anchor).toBeUndefined();
  });

  it("matches a key-only anchor by thumbprint when the issuer key is resolved", async () => {
    const keyOnly: TrustAnchor = {
      label: "pasted",
      source: "pasted by you",
      publicJwk: issuerKey,
    };
    const result = await checkIssuerTrust({ credential, issuerKey, anchors: [keyOnly] });
    expect(result.status).toBe("trusted");
    expect(result.basis).toBe("key-thumbprint");
  });

  it("cannot thumbprint-match without a resolved issuer key", async () => {
    const keyOnly: TrustAnchor = {
      label: "pasted",
      source: "pasted by you",
      publicJwk: issuerKey,
    };
    const result = await checkIssuerTrust({ credential, anchors: [keyOnly] });
    expect(result.status).toBe("unknown");
  });
});
