import type { Check, CheckId, Credential } from "@/domain/types";
import { checkAudience, checkNonce } from "@/verify/binding";
import { checkDisclosureIntegrity } from "@/verify/disclosureIntegrity";
import { checkIssuerSignature } from "@/verify/issuerSignature";
import { checkKeyBindingSignature } from "@/verify/keyBindingSignature";
import { checkSdHash } from "@/verify/sdHash";
import { checkTemporal } from "@/verify/temporal";

/**
 * Everything the verify layer needs. The artifact and the verifier's `nowSeconds` are required; the
 * issuer key (paste path, ADR 0003) and the expected `aud`/`nonce` (from a paired request) are
 * optional — absent inputs make their checks `skip`, never `fail`.
 */
export interface VerificationInput {
  readonly credential: Credential;
  readonly nowSeconds: number;
  readonly issuerKey?: JsonWebKey | undefined;
  readonly expectedAudience?: string | undefined;
  readonly expectedNonce?: string | undefined;
}

/** The full set of checks for one credential — ordered for display and indexed by id for lookup. */
export interface VerificationResult {
  readonly checks: readonly Check[];
  readonly byId: Readonly<Record<CheckId, Check>>;
}

/**
 * Run the full ADR-0002 check set against a decoded SD-JWT VC. Signature checks run concurrently; the
 * others are synchronous. The order in {@link VerificationResult.checks} is stable for the UI.
 */
export async function verifyCredential(input: VerificationInput): Promise<VerificationResult> {
  const { credential, nowSeconds, issuerKey, expectedAudience, expectedNonce } = input;
  const [issuerSignature, keyBindingSignature, sdHash, disclosureIntegrity] = await Promise.all([
    checkIssuerSignature(credential, issuerKey),
    checkKeyBindingSignature(credential),
    checkSdHash(credential),
    checkDisclosureIntegrity(credential),
  ]);
  const checks: readonly Check[] = [
    issuerSignature,
    keyBindingSignature,
    sdHash,
    disclosureIntegrity,
    checkTemporal(credential, nowSeconds),
    checkAudience(credential, expectedAudience),
    checkNonce(credential, expectedNonce),
  ];
  const byId = Object.fromEntries(checks.map((check) => [check.id, check])) as Record<
    CheckId,
    Check
  >;
  return { checks, byId };
}
