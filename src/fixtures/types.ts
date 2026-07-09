/**
 * Types for the committed EUDI test-vector matrix. The vectors are generated offline by
 * `eudi-solana/packages/signer-credo/scripts/gen-inspector-fixtures.ts` and consumed here by tests
 * and (later) the "load example" UI. See `./README.md`.
 */

/** Result of a single verification check: passed, failed, or could-not-run — all first-class (ADR 0002). */
export type CheckOutcome = "pass" | "fail" | "skip";

/** Which artifact a fixture carries. */
export type FixtureKind = "sd-jwt-vc-issuance" | "sd-jwt-vc-presentation" | "openid4vp-request";

/**
 * The intended outcome of each SD-JWT VC verification check. A negative fixture sets exactly one
 * field to `"fail"`; a field is `"skip"` when the check does not apply (e.g. key-binding on a bare
 * issuance, which has no KB-JWT).
 */
export interface VerifyExpectation {
  readonly issuerSignature: CheckOutcome;
  readonly keyBindingSignature: CheckOutcome;
  readonly sdHash: CheckOutcome;
  readonly temporal: CheckOutcome;
  readonly audience: CheckOutcome;
  readonly nonce: CheckOutcome;
}

/** Inputs a verifier needs to reproduce the checks against an SD-JWT VC fixture. */
export interface FixtureContext {
  /** Unix-seconds "now" the temporal check runs at — pinned so the vectors are deterministic. */
  readonly verificationTimeSeconds: number;
  /** The issuer's public key (paste-path input for issuer-signature verification, ADR 0003). */
  readonly issuerPublicJwk: JsonWebKey;
  /** The holder device public key that the credential's `cnf` binds. */
  readonly holderPublicJwk: JsonWebKey;
  /** The verifier the presentation must be bound to; absent for a bare issuance. */
  readonly expectedAudience?: string;
  /** The challenge the verifier issued; absent for a bare issuance. */
  readonly expectedNonce?: string;
}

/** A committed SD-JWT VC issuance or presentation vector. */
export interface SdJwtFixture {
  readonly id: string;
  readonly kind: "sd-jwt-vc-issuance" | "sd-jwt-vc-presentation";
  readonly description: string;
  /** The compact `<issuer-jwt>~<disclosure>…~[<kb-jwt>]` artifact. */
  readonly compact: string;
  readonly context: FixtureContext;
  readonly expect: VerifyExpectation;
}

/** A committed OpenID4VP authorization-request vector (DCQL or Presentation Exchange). */
export interface OpenId4VpFixture {
  readonly id: string;
  readonly kind: "openid4vp-request";
  readonly description: string;
  readonly request: Readonly<Record<string, unknown>>;
  /** Ids of the overasking rules this request should fire (empty for a justified request). */
  readonly expect: { readonly overaskingRuleIds: readonly string[] };
}

export type Fixture = SdJwtFixture | OpenId4VpFixture;
