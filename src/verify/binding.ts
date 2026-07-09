import type { Check, CheckId, Credential } from "@/domain/types";

/**
 * Compare one KB-JWT binding claim against the value the verifier expects.
 *
 * `skip` when there is no KB-JWT (a bare issuance is bound to nothing) or when no expected value is
 * supplied (the presentation is not paired with a request yet) — never `fail`, so a missing pairing
 * cannot read as a forged binding. Otherwise `pass` on an exact match, `fail` on a mismatch.
 */
function checkBinding(
  id: CheckId,
  label: string,
  presented: string | undefined,
  expected: string | undefined,
): Check {
  if (presented === undefined) {
    return {
      id,
      outcome: "skip",
      reason: `No KB-JWT — nothing binds a ${label} on a bare issuance.`,
    };
  }
  if (expected === undefined) {
    return {
      id,
      outcome: "skip",
      reason: `No expected ${label} supplied — pair the presentation with its request.`,
    };
  }
  return presented === expected
    ? { id, outcome: "pass", reason: `KB-JWT ${label} matches the expected value.` }
    : {
        id,
        outcome: "fail",
        reason: `KB-JWT ${label} "${presented}" does not match the expected "${expected}".`,
      };
}

/** Check the KB-JWT `aud` binds this presentation to the verifier consuming it. */
export function checkAudience(credential: Credential, expectedAudience: string | undefined): Check {
  return checkBinding("audience", "audience", credential.kbJwt?.aud, expectedAudience);
}

/** Check the KB-JWT `nonce` answers the challenge the verifier issued (replay protection). */
export function checkNonce(credential: Credential, expectedNonce: string | undefined): Check {
  return checkBinding("nonce", "nonce", credential.kbJwt?.nonce, expectedNonce);
}
