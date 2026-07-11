import { resolveDisclosures } from "@/domain/disclosures";
import type { Check, Credential } from "@/domain/types";

const ID = "disclosure-integrity" as const;

/**
 * Verify every presented disclosure is bound to the issuer signature — i.e. its SHA-256 digest is
 * referenced by an `_sd` entry (or an array `...` placeholder) inside the issuer-signed payload.
 *
 * The issuer signature only covers the issuer JWT, not the disclosures appended after it, so this is
 * the check that extends issuer trust to the disclosed claims: a disclosure whose digest matches no
 * issuer-signed placeholder was injected after issuance and would otherwise pass unnoticed. `skip`
 * when there are no disclosures, or the `_sd_alg` is one this tool cannot recompute (only `sha-256`).
 */
export async function checkDisclosureIntegrity(credential: Credential): Promise<Check> {
  const sdAlg = credential.issuerJwt.payload["_sd_alg"];
  if (sdAlg !== undefined && sdAlg !== "sha-256") {
    return {
      id: ID,
      outcome: "skip",
      reason: `Unsupported _sd_alg "${String(sdAlg)}" — only sha-256 disclosure digests are checked.`,
    };
  }
  if (credential.disclosures.length === 0) {
    return { id: ID, outcome: "skip", reason: "No disclosures presented — nothing to bind." };
  }
  const { unmatched } = await resolveDisclosures(credential);
  if (unmatched.length === 0) {
    return {
      id: ID,
      outcome: "pass",
      reason: "Every disclosure is bound to an issuer-signed _sd digest.",
    };
  }
  const names = unmatched.map((d) => d.claimName ?? "(array element)").join(", ");
  return {
    id: ID,
    outcome: "fail",
    reason: `${unmatched.length} disclosure(s) not bound to any issuer _sd digest — injected after issuance: ${names}.`,
  };
}
