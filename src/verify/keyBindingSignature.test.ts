import { describe, expect, it } from "vitest";

import { base64UrlToBytes, bytesToBase64Url } from "@/domain/encoding";
import { decodeSdJwtVc } from "@/domain/sdJwt";
import { getFixture } from "@/fixtures";
import type { SdJwtFixture } from "@/fixtures/types";
import { checkKeyBindingSignature } from "@/verify/keyBindingSignature";

const fixture = (id: string): SdJwtFixture => getFixture(id) as SdJwtFixture;

/** Flip a real byte of the KB-JWT signature to produce a genuinely-invalid presentation. */
function tamperKbSignature(compact: string): string {
  const segments = compact.split("~");
  const [header, payload, signature] = (segments.at(-1) ?? "").split(".");
  const bytes = base64UrlToBytes(signature!);
  bytes[0] = bytes[0]! ^ 0xff;
  segments[segments.length - 1] = `${header}.${payload}.${bytesToBase64Url(bytes)}`;
  return segments.join("~");
}

describe("checkKeyBindingSignature", () => {
  it("passes a valid ES256 KB-JWT signature against the credential's cnf key", async () => {
    const check = await checkKeyBindingSignature(
      decodeSdJwtVc(fixture("good-presentation").compact),
    );
    expect(check.id).toBe("key-binding-signature");
    expect(check.outcome).toBe("pass");
  });

  it("skips a bare issuance that carries no KB-JWT", async () => {
    const check = await checkKeyBindingSignature(decodeSdJwtVc(fixture("good-issuance").compact));
    expect(check.outcome).toBe("skip");
  });

  it("fails when the KB-JWT signature is corrupted", async () => {
    const tampered = tamperKbSignature(fixture("good-presentation").compact);
    const check = await checkKeyBindingSignature(decodeSdJwtVc(tampered));
    expect(check.outcome).toBe("fail");
  });
});
