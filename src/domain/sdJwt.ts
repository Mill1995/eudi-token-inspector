import { decodeJsonSegment } from "@/domain/encoding";
import { decodeJws } from "@/domain/jws";
import type { Credential, Disclosure, KbJwt } from "@/domain/types";

/** Parse one `~`-separated disclosure token: `[salt, name, value]` or `[salt, value]`. */
function parseDisclosure(raw: string): Disclosure {
  const decoded = decodeJsonSegment(raw);
  if (!Array.isArray(decoded) || decoded.length < 2 || decoded.length > 3) {
    throw new Error(`disclosure is not a 2- or 3-element array: ${raw.slice(0, 16)}…`);
  }
  const salt = String(decoded[0]);
  if (decoded.length === 3) {
    return { raw, salt, claimName: String(decoded[1]), value: decoded[2] };
  }
  return { raw, salt, value: decoded[1] };
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Build the {@link KbJwt} view of a presentation's trailing compact JWS. */
function parseKbJwt(segment: string): KbJwt {
  const jws = decodeJws(segment);
  const kb: KbJwt = { jws };
  const sdHash = optionalString(jws.payload["sd_hash"]);
  const aud = optionalString(jws.payload["aud"]);
  const nonce = optionalString(jws.payload["nonce"]);
  return {
    ...kb,
    ...(sdHash !== undefined && { sdHash }),
    ...(aud !== undefined && { aud }),
    ...(nonce !== undefined && { nonce }),
  };
}

/**
 * Decode a compact SD-JWT VC — `<issuer-jwt>~<disclosure>…~[<kb-jwt>]` — into a {@link Credential}.
 * An issuance ends with a trailing `~` and no KB-JWT; a presentation's final segment is a 3-part JWS.
 * Throws on a malformed issuer JWT or disclosure.
 */
export function decodeSdJwtVc(compact: string): Credential {
  const [issuerSegment, ...rest] = compact.split("~");
  if (issuerSegment === undefined) throw new Error("empty SD-JWT VC");
  const issuerJwt = decodeJws(issuerSegment);

  let kbJwt: KbJwt | undefined;
  const last = rest.at(-1);
  if (last !== undefined && last.includes(".")) {
    kbJwt = parseKbJwt(rest.pop() as string);
  } else if (last === "") {
    rest.pop();
  }
  const disclosures = rest.filter((segment) => segment !== "").map(parseDisclosure);

  return {
    kind: "credential",
    issuerJwt,
    disclosures,
    ...(kbJwt !== undefined && { kbJwt }),
    compact,
    sdHashInput: compact.slice(0, compact.lastIndexOf("~") + 1),
  };
}
