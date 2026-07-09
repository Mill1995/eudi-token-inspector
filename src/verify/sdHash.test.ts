import { describe, expect, it } from "vitest";

import { decodeSdJwtVc } from "@/domain/sdJwt";
import { getFixture } from "@/fixtures";
import type { SdJwtFixture } from "@/fixtures/types";
import { checkSdHash } from "@/verify/sdHash";

const fixture = (id: string): SdJwtFixture => getFixture(id) as SdJwtFixture;

describe("checkSdHash", () => {
  it("passes when the recomputed sd_hash matches the presented disclosures", async () => {
    const check = await checkSdHash(decodeSdJwtVc(fixture("good-presentation").compact));
    expect(check.id).toBe("sd-hash");
    expect(check.outcome).toBe("pass");
  });

  it("fails when a disclosure was dropped after signing", async () => {
    const check = await checkSdHash(decodeSdJwtVc(fixture("bad-sd-hash-mismatch").compact));
    expect(check.outcome).toBe("fail");
  });

  it("skips a bare issuance with no KB-JWT", async () => {
    const check = await checkSdHash(decodeSdJwtVc(fixture("good-issuance").compact));
    expect(check.outcome).toBe("skip");
  });
});
