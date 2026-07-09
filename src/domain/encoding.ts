/** base64url ⇄ bytes and the JSON decode used throughout SD-JWT parsing. No padding is assumed. */

/** Decode a base64url string (unpadded or padded) to raw bytes. Throws on non-base64url input. */
export function base64UrlToBytes(segment: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]*$/.test(segment)) {
    throw new Error(`not a base64url segment: ${JSON.stringify(segment.slice(0, 16))}…`);
  }
  const base64 = segment.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Encode raw bytes to an unpadded base64url string. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

/** UTF-8 bytes of a string (the input to a hash or the signed content of a JWS). */
export function utf8ToBytes(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(new TextEncoder().encode(text));
}

/** Decode a base64url segment as UTF-8 JSON. Throws on invalid base64url or invalid JSON. */
export function decodeJsonSegment(segment: string): unknown {
  const json = new TextDecoder().decode(base64UrlToBytes(segment));
  return JSON.parse(json);
}
