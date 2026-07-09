/**
 * The trust layer: a **configurable trust checker, not a trust authority** (ADR 0004). A credential's
 * issuer is compared against trust anchors — a bundled curated snapshot plus any the user pastes in —
 * and every result is **informational**, never an authoritative trust decision.
 */

/** One trusted issuer: its public key, plus where it came from so the UI can attribute it. */
export interface TrustAnchor {
  /** Human label for the issuer, e.g. "EUDI Inspector reference issuer". */
  readonly label: string;
  /** Provenance of this anchor — a sourced note (curated) or "pasted by you" (imported). */
  readonly source: string;
  /** The issuer identifier this anchor covers (`did:key` / `https` URL); absent for a key-only paste. */
  readonly issuer?: string;
  /** The issuer public key the anchor trusts. */
  readonly publicJwk: JsonWebKey;
}

/** Why a credential matched an anchor: its issuer id, or its signing key's thumbprint. */
export type TrustBasis = "issuer-id" | "key-thumbprint";

/** The informational outcome of checking a credential's issuer against the trust anchors. */
export interface TrustResult {
  /** The credential's `iss` (empty string when the credential carries none). */
  readonly issuer: string;
  readonly status: "trusted" | "unknown";
  /** The anchor that matched, when `status` is `trusted`. */
  readonly anchor?: TrustAnchor;
  readonly basis?: TrustBasis;
}
