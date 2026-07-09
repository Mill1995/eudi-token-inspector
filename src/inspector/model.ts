import { decodeSdJwtVc } from "@/domain/sdJwt";
import type { Credential } from "@/domain/types";
import { sdJwtFixtures } from "@/fixtures";

/** A ready-to-load example: the artifact plus the verification context a verifier would supply. */
export interface Example {
  readonly id: string;
  readonly description: string;
  readonly compact: string;
  readonly issuerKeyText: string;
  readonly expectedAudience: string;
  readonly expectedNonce: string;
  readonly verificationTime: string;
}

/** The committed SD-JWT VC vectors, shaped for the "load example" picker. */
export const EXAMPLES: readonly Example[] = sdJwtFixtures.map((fixture) => ({
  id: fixture.id,
  description: fixture.description,
  compact: fixture.compact,
  issuerKeyText: JSON.stringify(fixture.context.issuerPublicJwk, null, 2),
  expectedAudience: fixture.context.expectedAudience ?? "",
  expectedNonce: fixture.context.expectedNonce ?? "",
  verificationTime: String(fixture.context.verificationTimeSeconds),
}));

/** Outcome of decoding pasted input: a credential, or the reason it could not be decoded. */
export type DecodeResult =
  | { readonly ok: true; readonly credential: Credential }
  | { readonly ok: false; readonly error: string };

/** Decode a pasted compact SD-JWT VC, capturing the parse error instead of throwing. */
export function decodeArtifact(input: string): DecodeResult {
  try {
    return { ok: true, credential: decodeSdJwtVc(input.trim()) };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

/**
 * Parse a pasted issuer key. Accepts a bare JWK or a JWKS (`{ keys: [...] }`), taking the first key.
 * Returns undefined for blank or unparseable input so the issuer-signature check reads as `skip`.
 */
export function parseIssuerKey(text: string): JsonWebKey | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (typeof parsed !== "object" || parsed === null) return undefined;
    const keys = (parsed as { keys?: unknown }).keys;
    if (Array.isArray(keys)) return keys[0] as JsonWebKey | undefined;
    return parsed as JsonWebKey;
  } catch {
    return undefined;
  }
}
