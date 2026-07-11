import { bytesToBase64Url, utf8ToBytes } from "@/domain/encoding";
import type { Credential, Disclosure } from "@/domain/types";

/** The array-element placeholder key an SD-JWT uses for a selectively-disclosable array item. */
const ARRAY_ELEMENT_KEY = "...";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `base64url(sha-256(disclosure))` — the digest an issuer embeds in `_sd` (or an array `...`). */
async function disclosureDigest(raw: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8ToBytes(raw));
  return bytesToBase64Url(new Uint8Array(digest));
}

/** The outcome of walking the issuer payload and substituting the presented disclosures back in. */
export interface ResolvedDisclosures {
  /** The issuer payload with every disclosed `_sd`/array digest replaced by its value; `_sd`* stripped. */
  readonly claims: Record<string, unknown>;
  /** Presented disclosures whose digest no issuer-signed `_sd`/array placeholder referenced. */
  readonly unmatched: readonly Disclosure[];
}

/** Recursively substitute disclosed values for `_sd` digests (objects) and `...` placeholders (arrays). */
function resolveValue(
  value: unknown,
  byDigest: ReadonlyMap<string, Disclosure>,
  used: Set<string>,
): unknown {
  if (Array.isArray(value)) return resolveArray(value, byDigest, used);
  if (!isRecord(value)) return value;

  const resolved: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === "_sd" || key === "_sd_alg") continue;
    resolved[key] = resolveValue(nested, byDigest, used);
  }
  const sd = value["_sd"];
  if (Array.isArray(sd)) {
    for (const digest of sd) {
      const disclosure = typeof digest === "string" ? byDigest.get(digest) : undefined;
      if (disclosure?.claimName === undefined) continue;
      used.add(digest as string);
      resolved[disclosure.claimName] = resolveValue(disclosure.value, byDigest, used);
    }
  }
  return resolved;
}

function resolveArray(
  items: readonly unknown[],
  byDigest: ReadonlyMap<string, Disclosure>,
  used: Set<string>,
): unknown[] {
  const out: unknown[] = [];
  for (const item of items) {
    const placeholder =
      isRecord(item) && typeof item[ARRAY_ELEMENT_KEY] === "string"
        ? (item[ARRAY_ELEMENT_KEY] as string)
        : undefined;
    if (placeholder === undefined) {
      out.push(resolveValue(item, byDigest, used));
      continue;
    }
    const disclosure = byDigest.get(placeholder);
    if (disclosure !== undefined) {
      used.add(placeholder);
      out.push(resolveValue(disclosure.value, byDigest, used));
    }
  }
  return out;
}

/**
 * Reconstruct the credential's plaintext claims by substituting each presented disclosure back into
 * the issuer-signed payload, following `_sd` digests and array `...` placeholders (recursively, so
 * nested selective disclosure resolves). A disclosure whose digest is referenced by no
 * issuer-signed placeholder is reported in `unmatched` — it was not sealed by the issuer signature.
 *
 * Digests are SHA-256 (`_sd_alg` default). A credential with a different `_sd_alg` cannot be
 * recomputed here; callers should treat that as "cannot decide".
 */
export async function resolveDisclosures(credential: Credential): Promise<ResolvedDisclosures> {
  const entries = await Promise.all(
    credential.disclosures.map(async (disclosure) => ({
      disclosure,
      digest: await disclosureDigest(disclosure.raw),
    })),
  );
  const digests = new Map(entries.map((entry) => [entry.disclosure, entry.digest]));
  const byDigest = new Map(entries.map((entry) => [entry.digest, entry.disclosure]));
  const used = new Set<string>();
  const claims = resolveValue(credential.issuerJwt.payload, byDigest, used) as Record<
    string,
    unknown
  >;
  const unmatched = credential.disclosures.filter(
    (disclosure) => !used.has(digests.get(disclosure) as string),
  );
  return { claims, unmatched };
}
