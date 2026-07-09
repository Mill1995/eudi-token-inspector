import type { TrustAnchor } from "@/trust/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJwk(value: unknown): value is JsonWebKey {
  return isRecord(value) && typeof value["kty"] === "string";
}

/** Pull the candidate JWKs out of a parsed paste: a JWKS (`{ keys }`), an array, or a bare JWK. */
function candidateJwks(parsed: unknown): unknown[] {
  if (isRecord(parsed) && Array.isArray(parsed["keys"])) return parsed["keys"];
  if (Array.isArray(parsed)) return parsed;
  if (isJwk(parsed)) return [parsed];
  return [];
}

function labelFor(jwk: JsonWebKey): string {
  const kid = (jwk as Record<string, unknown>)["kid"];
  return typeof kid === "string" ? kid : `${String(jwk.kty)} key`;
}

/**
 * Parse pasted trust-anchor input into {@link TrustAnchor}s. Accepts a JWKS (`{ keys: [...] }`), a
 * bare JWK, or an array of JWKs; each key becomes a key-only anchor matched by thumbprint. Returns an
 * empty list for input that carries no key (invalid JSON, or JSON with no `kty`) — never throws.
 */
export function parseTrustAnchors(text: string): TrustAnchor[] {
  const trimmed = text.trim();
  if (trimmed === "") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return [];
  }
  return candidateJwks(parsed)
    .filter(isJwk)
    .map((jwk) => ({ label: labelFor(jwk), source: "pasted by you", publicJwk: jwk }));
}
