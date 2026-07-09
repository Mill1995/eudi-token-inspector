import { bytesToBase64Url, utf8ToBytes } from "@/domain/encoding";
import type { Check, Credential } from "@/domain/types";

const ID = "sd-hash" as const;

/** base64url(sha-256(input)) — the SD-JWT disclosure-hash construction. */
async function sha256Base64Url(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8ToBytes(input));
  return bytesToBase64Url(new Uint8Array(digest));
}

/**
 * Recompute the KB-JWT's `sd_hash` over the presented SD-JWT (everything up to and including the final
 * `~`) and compare it to the value the holder signed. A mismatch means the disclosed set was altered
 * after the KB-JWT was signed. `skip` for a bare issuance, a missing `sd_hash`, or an unsupported
 * `_sd_alg` (only `sha-256` is defined for v1).
 */
export async function checkSdHash(credential: Credential): Promise<Check> {
  if (credential.kbJwt === undefined) {
    return {
      id: ID,
      outcome: "skip",
      reason: "No KB-JWT — sd_hash binds a presentation, not a bare issuance.",
    };
  }
  const presented = credential.kbJwt.sdHash;
  if (presented === undefined) {
    return { id: ID, outcome: "skip", reason: "KB-JWT carries no sd_hash claim." };
  }
  const sdAlg = credential.issuerJwt.payload["_sd_alg"];
  if (sdAlg !== undefined && sdAlg !== "sha-256") {
    return {
      id: ID,
      outcome: "skip",
      reason: `Unsupported _sd_alg "${String(sdAlg)}" — only sha-256 is verified.`,
    };
  }
  const recomputed = await sha256Base64Url(credential.sdHashInput);
  return recomputed === presented
    ? { id: ID, outcome: "pass", reason: "sd_hash matches the presented disclosure set." }
    : {
        id: ID,
        outcome: "fail",
        reason:
          "sd_hash does not match the presented disclosures — the set was altered after signing.",
      };
}
