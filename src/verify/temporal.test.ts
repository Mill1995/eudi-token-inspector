import { describe, expect, it } from "vitest";

import { decodeSdJwtVc } from "@/domain/sdJwt";
import type { Credential } from "@/domain/types";
import { getFixture } from "@/fixtures";
import type { SdJwtFixture } from "@/fixtures/types";
import { checkTemporal } from "@/verify/temporal";

const fixture = (id: string): SdJwtFixture => getFixture(id) as SdJwtFixture;
const at = (id: string): number => fixture(id).context.verificationTimeSeconds;

describe("checkTemporal", () => {
  it("passes a credential inside its validity window at the verification time", () => {
    const check = checkTemporal(
      decodeSdJwtVc(fixture("good-issuance").compact),
      at("good-issuance"),
    );
    expect(check.id).toBe("temporal");
    expect(check.outcome).toBe("pass");
  });

  it("fails a credential whose exp precedes the verification time", () => {
    const check = checkTemporal(decodeSdJwtVc(fixture("bad-expired").compact), at("bad-expired"));
    expect(check.outcome).toBe("fail");
  });

  it("skips a credential that carries no exp/nbf claims", () => {
    const bare: Credential = {
      kind: "credential",
      issuerJwt: {
        raw: "",
        header: {},
        payload: {},
        signingInput: "",
        signature: new Uint8Array(),
      },
      disclosures: [],
      compact: "",
      sdHashInput: "",
    };
    expect(checkTemporal(bare, 1780000000).outcome).toBe("skip");
  });
});
