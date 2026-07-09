import type { Check, Credential } from "@/domain/types";
import { UnsupportedAlgError, verifyJws } from "@/verify/webcrypto";

const ID = "key-binding-signature" as const;

/** The holder public key the credential binds via `cnf.jwk` — the key a KB-JWT must be signed by. */
function holderKey(credential: Credential): JsonWebKey | undefined {
  const cnf = credential.issuerJwt.payload["cnf"];
  if (typeof cnf !== "object" || cnf === null) return undefined;
  const jwk = (cnf as Record<string, unknown>)["jwk"];
  if (typeof jwk !== "object" || jwk === null) return undefined;
  return jwk as JsonWebKey;
}

/**
 * Verify the holder's Key-Binding JWT against the credential's `cnf` key.
 *
 * A bare issuance has no KB-JWT → `skip`. A credential with no `cnf.jwk` cannot bind a holder → `skip`.
 * The holder key is taken from the issuer-signed `cnf`, so this proves the presenter holds the key the
 * issuer bound — not merely that some key signed the KB-JWT.
 */
export async function checkKeyBindingSignature(credential: Credential): Promise<Check> {
  if (credential.kbJwt === undefined) {
    return {
      id: ID,
      outcome: "skip",
      reason: "No KB-JWT — a bare issuance carries no holder binding.",
    };
  }
  const key = holderKey(credential);
  if (key === undefined) {
    return { id: ID, outcome: "skip", reason: "Credential has no cnf.jwk to bind the holder key." };
  }
  try {
    const valid = await verifyJws(credential.kbJwt.jws, key);
    return valid
      ? {
          id: ID,
          outcome: "pass",
          reason: "Key-binding signature verified against the credential's cnf key.",
        }
      : {
          id: ID,
          outcome: "fail",
          reason: "Key-binding signature does not verify against the credential's cnf key.",
        };
  } catch (error) {
    if (error instanceof UnsupportedAlgError) {
      return { id: ID, outcome: "skip", reason: `Cannot verify: ${error.message}.` };
    }
    return {
      id: ID,
      outcome: "skip",
      reason: `Cannot verify — holder key is unusable: ${(error as Error).message}.`,
    };
  }
}
