import { describe, expect, it } from "vitest";

import { decodeSdJwtVc } from "@/domain/sdJwt";
import { getFixture } from "@/fixtures";
import type { SdJwtFixture } from "@/fixtures/types";
import { checkAudience, checkNonce } from "@/verify/binding";

const fixture = (id: string): SdJwtFixture => getFixture(id) as SdJwtFixture;

describe("checkAudience", () => {
  it("passes when the KB-JWT aud matches the expected verifier", () => {
    const f = fixture("good-presentation");
    const check = checkAudience(decodeSdJwtVc(f.compact), f.context.expectedAudience);
    expect(check.id).toBe("audience");
    expect(check.outcome).toBe("pass");
  });

  it("fails when the KB-JWT aud is a different verifier", () => {
    const f = fixture("bad-wrong-aud");
    expect(checkAudience(decodeSdJwtVc(f.compact), f.context.expectedAudience).outcome).toBe(
      "fail",
    );
  });

  it("skips a bare issuance with no KB-JWT", () => {
    const f = fixture("good-issuance");
    expect(checkAudience(decodeSdJwtVc(f.compact), f.context.expectedAudience).outcome).toBe(
      "skip",
    );
  });

  it("skips when no expected audience is supplied", () => {
    const f = fixture("good-presentation");
    expect(checkAudience(decodeSdJwtVc(f.compact), undefined).outcome).toBe("skip");
  });
});

describe("checkNonce", () => {
  it("passes when the KB-JWT nonce matches the challenge", () => {
    const f = fixture("good-presentation");
    const check = checkNonce(decodeSdJwtVc(f.compact), f.context.expectedNonce);
    expect(check.id).toBe("nonce");
    expect(check.outcome).toBe("pass");
  });

  it("fails when the KB-JWT nonce is stale", () => {
    const f = fixture("bad-wrong-nonce");
    expect(checkNonce(decodeSdJwtVc(f.compact), f.context.expectedNonce).outcome).toBe("fail");
  });

  it("skips when no expected nonce is supplied", () => {
    const f = fixture("good-presentation");
    expect(checkNonce(decodeSdJwtVc(f.compact), undefined).outcome).toBe("skip");
  });
});
