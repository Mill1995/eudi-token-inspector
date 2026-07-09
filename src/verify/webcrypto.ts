import { utf8ToBytes } from "@/domain/encoding";
import type { Jws } from "@/domain/types";

/** Raised when a JWS `alg` is one the inspector cannot verify with WebCrypto — mapped to `skip`. */
export class UnsupportedAlgError extends Error {
  constructor(alg: string) {
    super(`unsupported JWS alg "${alg}"`);
    this.name = "UnsupportedAlgError";
  }
}

interface AlgSpec {
  readonly importAlgorithm: EcKeyImportParams | Algorithm;
  readonly verifyAlgorithm: EcdsaParams | Algorithm;
}

/** Map a JOSE `alg` to the WebCrypto import + verify parameters (ADR 0006: ES256 / ES384 / EdDSA). */
function algSpec(alg: string): AlgSpec {
  switch (alg) {
    case "EdDSA":
      return { importAlgorithm: { name: "Ed25519" }, verifyAlgorithm: { name: "Ed25519" } };
    case "ES256":
      return {
        importAlgorithm: { name: "ECDSA", namedCurve: "P-256" },
        verifyAlgorithm: { name: "ECDSA", hash: "SHA-256" },
      };
    case "ES384":
      return {
        importAlgorithm: { name: "ECDSA", namedCurve: "P-384" },
        verifyAlgorithm: { name: "ECDSA", hash: "SHA-384" },
      };
    default:
      throw new UnsupportedAlgError(alg);
  }
}

/**
 * Verify a compact JWS's signature against a public JWK using WebCrypto.
 * Returns whether the signature is valid; throws {@link UnsupportedAlgError} for an unknown `alg`.
 * A structurally invalid JWK propagates as the underlying WebCrypto error.
 */
export async function verifyJws(jws: Jws, publicJwk: JsonWebKey): Promise<boolean> {
  const alg = jws.header["alg"];
  if (typeof alg !== "string") throw new UnsupportedAlgError(String(alg));
  const spec = algSpec(alg);
  const key = await crypto.subtle.importKey("jwk", publicJwk, spec.importAlgorithm, false, [
    "verify",
  ]);
  return crypto.subtle.verify(
    spec.verifyAlgorithm,
    key,
    jws.signature,
    utf8ToBytes(jws.signingInput),
  );
}
