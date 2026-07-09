import { bytesToBase64Url, utf8ToBytes } from "@/domain/encoding";

/**
 * The RFC 7638 canonical members for a JWK, in the required lexicographic order. Only the members
 * that define the public key are included; everything else (kid, use, alg) is excluded by design.
 */
function canonicalJson(jwk: JsonWebKey): string {
  switch (jwk.kty) {
    case "EC":
      return JSON.stringify({ crv: jwk.crv, kty: "EC", x: jwk.x, y: jwk.y });
    case "OKP":
      return JSON.stringify({ crv: jwk.crv, kty: "OKP", x: jwk.x });
    case "RSA":
      return JSON.stringify({ e: jwk.e, kty: "RSA", n: jwk.n });
    case "oct":
      return JSON.stringify({ k: jwk.k, kty: "oct" });
    default:
      throw new Error(`unsupported kty "${String(jwk.kty)}" for thumbprint`);
  }
}

/**
 * Compute the RFC 7638 JWK thumbprint: base64url(SHA-256(canonical JWK)). Two keys with the same
 * public material produce the same thumbprint regardless of their `kid`/`use`/`alg` metadata, which
 * is what lets the trust check match a credential's issuer key against a trust anchor.
 */
export async function jwkThumbprint(jwk: JsonWebKey): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8ToBytes(canonicalJson(jwk)));
  return bytesToBase64Url(new Uint8Array(digest));
}
