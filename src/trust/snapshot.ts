import snapshot from "@/trust/snapshot.json";
import type { TrustAnchor } from "@/trust/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Narrow one snapshot entry to a {@link TrustAnchor}, failing fast on malformed data. */
function parseAnchor(raw: unknown): TrustAnchor {
  if (!isRecord(raw)) throw new Error("trust anchor is not an object");
  const { label, source, issuer, publicJwk } = raw;
  if (typeof label !== "string" || typeof source !== "string") {
    throw new Error(`malformed trust anchor (label/source): ${JSON.stringify(raw)}`);
  }
  if (!isRecord(publicJwk)) throw new Error(`trust anchor "${label}" has no publicJwk`);
  return {
    label,
    source,
    ...(typeof issuer === "string" && { issuer }),
    publicJwk: publicJwk as JsonWebKey,
  };
}

/** The bundled curated snapshot of known issuers (ADR 0004), editable in `snapshot.json`. */
export const CURATED_ANCHORS: readonly TrustAnchor[] = snapshot.anchors.map(parseAnchor);
