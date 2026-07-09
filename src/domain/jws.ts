import { base64UrlToBytes, decodeJsonSegment } from "@/domain/encoding";
import type { Jws } from "@/domain/types";

function asObject(value: unknown, part: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`JWS ${part} is not a JSON object`);
  }
  return value as Record<string, unknown>;
}

/**
 * Decode a compact JWS (`<header>.<payload>.<signature>`) into its parts plus the signing input and
 * raw signature bytes a verifier needs. Throws if the shape is not three base64url segments.
 */
export function decodeJws(raw: string): Jws {
  const parts = raw.split(".");
  if (parts.length !== 3) {
    throw new Error(`compact JWS must have 3 segments, got ${parts.length}`);
  }
  const [headerSegment, payloadSegment, signatureSegment] = parts as [string, string, string];
  const header = asObject(decodeJsonSegment(headerSegment), "header");
  const payload = asObject(decodeJsonSegment(payloadSegment), "payload");
  return {
    raw,
    header,
    payload,
    signingInput: `${headerSegment}.${payloadSegment}`,
    signature: base64UrlToBytes(signatureSegment),
  };
}
