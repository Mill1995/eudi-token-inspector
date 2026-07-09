import type { Credential } from "@/domain/types";
import { jwkThumbprint } from "@/trust/thumbprint";
import type { TrustAnchor, TrustResult } from "@/trust/types";

/** Inputs to the trust check: the credential, its resolved issuer key (if any), and the anchors. */
export interface TrustInput {
  readonly credential: Credential;
  readonly issuerKey?: JsonWebKey | undefined;
  readonly anchors: readonly TrustAnchor[];
}

function issuerOf(credential: Credential): string {
  const iss = credential.issuerJwt.payload["iss"];
  return typeof iss === "string" ? iss : "";
}

/**
 * Check a credential's issuer against the trust anchors. Matches first by issuer identifier, then —
 * when the issuer key is resolved — by RFC 7638 key thumbprint, so a pasted JWKS trusts an issuer
 * even without an identifier. The result is **informational** (ADR 0004), never a pass/fail verdict.
 */
export async function checkIssuerTrust(input: TrustInput): Promise<TrustResult> {
  const { credential, issuerKey, anchors } = input;
  const issuer = issuerOf(credential);

  if (issuer !== "") {
    const byId = anchors.find((anchor) => anchor.issuer === issuer);
    if (byId !== undefined) {
      return { issuer, status: "trusted", anchor: byId, basis: "issuer-id" };
    }
  }

  if (issuerKey !== undefined) {
    const keyThumbprint = await jwkThumbprint(issuerKey);
    const anchorThumbprints = await Promise.all(anchors.map((a) => jwkThumbprint(a.publicJwk)));
    const match = anchors.find((_, index) => anchorThumbprints[index] === keyThumbprint);
    if (match !== undefined) {
      return { issuer, status: "trusted", anchor: match, basis: "key-thumbprint" };
    }
  }

  return { issuer, status: "unknown" };
}
