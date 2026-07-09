import type { Check, Credential } from "@/domain/types";

const ID = "temporal" as const;

function numberClaim(payload: Readonly<Record<string, unknown>>, key: string): number | undefined {
  const value = payload[key];
  return typeof value === "number" ? value : undefined;
}

/**
 * Check the validity window of the credential (and KB-JWT, if present) against the verification time.
 *
 * `now >= exp` is expired; `now < nbf` is not-yet-valid; either boundary breached on either JWT is a
 * `fail`. With no `exp`/`nbf` on either token there is nothing to decide → `skip`. `nowSeconds` is the
 * verifier's time (the fixtures pin it so outcomes are deterministic), not the wall clock.
 */
export function checkTemporal(credential: Credential, nowSeconds: number): Check {
  const payloads: Array<Readonly<Record<string, unknown>>> = [credential.issuerJwt.payload];
  if (credential.kbJwt !== undefined) payloads.push(credential.kbJwt.jws.payload);

  let sawBoundary = false;
  const problems: string[] = [];
  for (const payload of payloads) {
    const exp = numberClaim(payload, "exp");
    const nbf = numberClaim(payload, "nbf");
    if (exp !== undefined) {
      sawBoundary = true;
      if (nowSeconds >= exp) problems.push(`expired at ${exp} (now ${nowSeconds})`);
    }
    if (nbf !== undefined) {
      sawBoundary = true;
      if (nowSeconds < nbf) problems.push(`not valid before ${nbf} (now ${nowSeconds})`);
    }
  }

  if (!sawBoundary) {
    return { id: ID, outcome: "skip", reason: "No exp/nbf temporal claims to check." };
  }
  return problems.length === 0
    ? { id: ID, outcome: "pass", reason: `Within the validity window at ${nowSeconds}.` }
    : { id: ID, outcome: "fail", reason: `${problems.join("; ")}.` };
}
