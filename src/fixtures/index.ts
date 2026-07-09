import type { Fixture, OpenId4VpFixture, SdJwtFixture } from "@/fixtures/types";
import badExpired from "@/fixtures/vectors/bad-expired.json";
import badSdHashMismatch from "@/fixtures/vectors/bad-sd-hash-mismatch.json";
import badTamperedIssuerSig from "@/fixtures/vectors/bad-tampered-issuer-sig.json";
import badWrongAud from "@/fixtures/vectors/bad-wrong-aud.json";
import badWrongNonce from "@/fixtures/vectors/bad-wrong-nonce.json";
import goodIssuance from "@/fixtures/vectors/good-issuance.json";
import goodPresentation from "@/fixtures/vectors/good-presentation.json";
import overaskingRequestDcql from "@/fixtures/vectors/overasking-request-dcql.json";
import requestPex from "@/fixtures/vectors/request-pex.json";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Narrow a committed JSON vector to a {@link Fixture}, failing fast on a malformed one. */
function parseFixture(raw: unknown): Fixture {
  if (!isRecord(raw)) throw new Error("fixture is not an object");
  const id = raw["id"];
  const kind = raw["kind"];
  if (typeof id !== "string" || typeof kind !== "string") {
    throw new Error(`malformed fixture (missing id/kind): ${JSON.stringify(raw)}`);
  }
  if (kind === "openid4vp-request") return raw as unknown as OpenId4VpFixture;
  if (kind === "sd-jwt-vc-issuance" || kind === "sd-jwt-vc-presentation") {
    if (typeof raw["compact"] !== "string") {
      throw new Error(`fixture "${id}" is ${kind} but carries no compact string`);
    }
    return raw as unknown as SdJwtFixture;
  }
  throw new Error(`fixture "${id}" has unknown kind "${kind}"`);
}

/** Every committed test vector, good and bad. */
export const fixtures: readonly Fixture[] = [
  goodIssuance,
  goodPresentation,
  badTamperedIssuerSig,
  badExpired,
  badSdHashMismatch,
  badWrongAud,
  badWrongNonce,
  overaskingRequestDcql,
  requestPex,
].map(parseFixture);

/** The SD-JWT VC issuance and presentation vectors. */
export const sdJwtFixtures: readonly SdJwtFixture[] = fixtures.filter(
  (fixture): fixture is SdJwtFixture => fixture.kind !== "openid4vp-request",
);

/** The OpenID4VP authorization-request vectors. */
export const openId4VpFixtures: readonly OpenId4VpFixture[] = fixtures.filter(
  (fixture): fixture is OpenId4VpFixture => fixture.kind === "openid4vp-request",
);

/** Look up a fixture by id, throwing if it is absent. */
export function getFixture(id: string): Fixture {
  const found = fixtures.find((fixture) => fixture.id === id);
  if (found === undefined) throw new Error(`no fixture with id "${id}"`);
  return found;
}
