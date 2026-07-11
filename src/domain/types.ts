/**
 * Format-agnostic domain model for the inspector. A pasted input is an {@link Artifact}; decoders
 * turn a compact string into one. No React, no DOM, no crypto — verification lives in `verify/`.
 * Keeping this layer format-agnostic is what lets v2 add mdoc without churning the UI (ADR 0006).
 */

/** A decoded compact JWS (`<header>.<payload>.<signature>`), with the bytes a verifier needs. */
export interface Jws {
  /** The original compact serialization. */
  readonly raw: string;
  readonly header: Readonly<Record<string, unknown>>;
  readonly payload: Readonly<Record<string, unknown>>;
  /** The signed `<header>.<payload>` string; the exact bytes a signature is computed over. */
  readonly signingInput: string;
  /** The decoded signature (raw r‖s for ECDSA, 64 bytes for Ed25519). */
  readonly signature: Uint8Array<ArrayBuffer>;
}

/** A salted `[salt, claim_name, value]` (object property) or `[salt, value]` (array element) triple. */
export interface Disclosure {
  /** The base64url token as it appears between `~` separators. */
  readonly raw: string;
  readonly salt: string;
  /** The claim name for an object-property disclosure; absent for an array-element disclosure. */
  readonly claimName?: string;
  readonly value: unknown;
}

/** The holder-signed Key-Binding JWT that seals a presentation to a verifier and disclosure set. */
export interface KbJwt {
  readonly jws: Jws;
  /** base64url(sha-256(SD-JWT up to and including the final `~`)); binds the disclosed set. */
  readonly sdHash?: string;
  /** The verifier this presentation is bound to. */
  readonly aud?: string;
  /** The verifier's challenge this presentation answers. */
  readonly nonce?: string;
}

/** An SD-JWT VC: an issuer-signed JWT plus disclosures and, in a presentation, a {@link KbJwt}. */
export interface Credential {
  readonly kind: "credential";
  readonly issuerJwt: Jws;
  readonly disclosures: readonly Disclosure[];
  /** Present only for a presentation; absent for a bare issuance. */
  readonly kbJwt?: KbJwt;
  /** The full original compact string. */
  readonly compact: string;
  /** The prefix the KB-JWT's `sd_hash` is computed over: everything up to and including the last `~`. */
  readonly sdHashInput: string;
}

/** Which query language a Presentation Request carried its claim selection in. */
export type QueryLanguage = "dcql" | "presentation-exchange";

/** How the presentation is requested: remote (cross-device / redirect) or in-person (proximity). */
export type PresentationFlow = "remote" | "in-person";

/** One claim a verifier asks for, normalized across DCQL and Presentation Exchange. */
export interface RequestedClaim {
  /** The claim path into the credential, e.g. `["birthdate"]` or `["address", "locality"]`. */
  readonly path: readonly string[];
  /** The value the claim is pinned to when the Query constrains it (PEX `filter.const`); else absent. */
  readonly constrainedTo?: unknown;
}

/** One credential a Presentation Request asks for, with the claims requested from it. */
export interface RequestedCredential {
  /** The Query's id for this entry (DCQL credential id / PEX input-descriptor id); absent if unnamed. */
  readonly id?: string;
  /** Accepted credential types when the Query pins them (DCQL `meta.vct_values` / PEX `vct` const). */
  readonly vctValues?: readonly string[];
  readonly claims: readonly RequestedClaim[];
  /**
   * True when the Query names no specific claims (DCQL with no `claims` member, PEX with no field
   * constraints) and therefore asks for the entire credential — the maximal, least-minimised ask.
   */
  readonly requestsAllClaims: boolean;
}

/** A decoded OpenID4VP Authorization Request — the verifier's ask, normalized across Query languages. */
export interface PresentationRequest {
  readonly kind: "presentation-request";
  readonly queryLanguage: QueryLanguage;
  readonly flow: PresentationFlow;
  readonly clientId?: string;
  readonly nonce?: string;
  /** The verifier-stated reason for the request (`purpose`), when present. */
  readonly purpose?: string;
  readonly credentials: readonly RequestedCredential[];
  /** The original request object, kept for the raw JSON view. */
  readonly raw: Readonly<Record<string, unknown>>;
}

/** The umbrella type for any pasted, decoded input. v2 adds `Mdoc`; pairing a request stays format-agnostic. */
export type Artifact = Credential | PresentationRequest;

/** A single verification check outcome: passed, failed, or could-not-run — all first-class (ADR 0002). */
export type CheckOutcome = "pass" | "fail" | "skip";

/** The verification checks v1 runs against an SD-JWT VC (ADR 0002). */
export type CheckId =
  | "issuer-signature"
  | "key-binding-signature"
  | "sd-hash"
  | "disclosure-integrity"
  | "temporal"
  | "audience"
  | "nonce";

/** The result of one check: an outcome and a human-readable reason, always both present. */
export interface Check {
  readonly id: CheckId;
  readonly outcome: CheckOutcome;
  /** Why the check reached this outcome — shown beside the badge; never empty. */
  readonly reason: string;
}
