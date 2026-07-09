import { decodePresentationRequest } from "@/domain/presentationRequest";
import { decodeSdJwtVc } from "@/domain/sdJwt";
import type { Artifact } from "@/domain/types";
import { openId4VpFixtures, sdJwtFixtures } from "@/fixtures";

/** A ready-to-load example: the pasted input plus the verification context a verifier would supply. */
export interface Example {
  readonly id: string;
  readonly description: string;
  /** Compact SD-JWT VC or OpenID4VP request JSON — whatever goes in the artifact box. */
  readonly input: string;
  readonly issuerKeyText: string;
  readonly expectedAudience: string;
  readonly expectedNonce: string;
  readonly verificationTime: string;
}

const EMPTY_CONTEXT = {
  issuerKeyText: "",
  expectedAudience: "",
  expectedNonce: "",
  verificationTime: "",
} as const;

/** The committed SD-JWT VC vectors, shaped for the "load example" picker with their verifier context. */
const CREDENTIAL_EXAMPLES: readonly Example[] = sdJwtFixtures.map((fixture) => ({
  id: fixture.id,
  description: fixture.description,
  input: fixture.compact,
  issuerKeyText: JSON.stringify(fixture.context.issuerPublicJwk, null, 2),
  expectedAudience: fixture.context.expectedAudience ?? "",
  expectedNonce: fixture.context.expectedNonce ?? "",
  verificationTime: String(fixture.context.verificationTimeSeconds),
}));

/** The committed OpenID4VP request vectors, shaped for the picker (no verifier context needed). */
const REQUEST_EXAMPLES: readonly Example[] = openId4VpFixtures.map((fixture) => ({
  id: fixture.id,
  description: fixture.description,
  input: JSON.stringify(fixture.request, null, 2),
  ...EMPTY_CONTEXT,
}));

/** Every loadable example: credentials first, then presentation requests. */
export const EXAMPLES: readonly Example[] = [...CREDENTIAL_EXAMPLES, ...REQUEST_EXAMPLES];

/** Outcome of decoding pasted input: an artifact, or the reason it could not be decoded. */
export type DecodeResult =
  | { readonly ok: true; readonly artifact: Artifact }
  | { readonly ok: false; readonly error: string };

/**
 * Decode pasted input into an {@link Artifact}, capturing the parse error instead of throwing. Input
 * that starts with `{` is read as an OpenID4VP request JSON; anything else as a compact SD-JWT VC.
 */
export function decodeArtifact(input: string): DecodeResult {
  const trimmed = input.trim();
  try {
    const artifact = trimmed.startsWith("{")
      ? decodePresentationRequest(JSON.parse(trimmed))
      : decodeSdJwtVc(trimmed);
    return { ok: true, artifact };
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
