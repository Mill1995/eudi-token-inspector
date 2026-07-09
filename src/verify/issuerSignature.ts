import type { Check, Credential } from "@/domain/types";
import { UnsupportedAlgError, verifyJws } from "@/verify/webcrypto";

const ID = "issuer-signature" as const;

/**
 * Verify the issuer's signature over the SD-JWT VC.
 *
 * Key resolution is the paste path (ADR 0003): the caller supplies the issuer's public JWK. With no
 * key the check is `skip` (not `fail`) — a missing key must never read as a forged signature. An
 * `alg` WebCrypto cannot handle is also `skip`; a resolvable key that does not verify is `fail`.
 */
export async function checkIssuerSignature(
  credential: Credential,
  issuerKey: JsonWebKey | undefined,
): Promise<Check> {
  const alg = String(credential.issuerJwt.header["alg"]);
  if (issuerKey === undefined) {
    return {
      id: ID,
      outcome: "skip",
      reason: "No issuer key resolved — paste the issuer JWKS/JWK to verify (ADR 0003).",
    };
  }
  try {
    const valid = await verifyJws(credential.issuerJwt, issuerKey);
    return valid
      ? { id: ID, outcome: "pass", reason: `Issuer signature verified (${alg}).` }
      : {
          id: ID,
          outcome: "fail",
          reason: "Issuer signature does not verify against the resolved key.",
        };
  } catch (error) {
    if (error instanceof UnsupportedAlgError) {
      return { id: ID, outcome: "skip", reason: `Cannot verify: ${error.message}.` };
    }
    return {
      id: ID,
      outcome: "skip",
      reason: `Cannot verify — issuer key is unusable: ${(error as Error).message}.`,
    };
  }
}
