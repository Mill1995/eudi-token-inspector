import { describe, expect, it } from "vitest";

import { decodePresentationRequest } from "@/domain/presentationRequest";
import { decodeSdJwtVc } from "@/domain/sdJwt";
import { openId4VpFixtures, sdJwtFixtures } from "@/fixtures";
import { decodedArtifactJson } from "@/inspector/share";

describe("decodedArtifactJson serializes a credential's decoded view", () => {
  const credential = decodeSdJwtVc(
    sdJwtFixtures.find((f) => f.id === "good-presentation")!.compact,
  );
  const parsed = JSON.parse(decodedArtifactJson(credential)) as Record<string, unknown>;

  it("carries the issuer payload and disclosures", () => {
    expect(parsed["kind"]).toBe("credential");
    const issuer = parsed["issuer"] as { payload: Record<string, unknown> };
    expect(issuer.payload["vct"]).toBe("urn:eudi:pid:1");
    expect(Array.isArray(parsed["disclosures"])).toBe(true);
  });
});

describe("decodedArtifactJson serializes a request's decoded view", () => {
  const request = decodePresentationRequest(
    openId4VpFixtures.find((f) => f.id === "overasking-request-dcql")!.request as Record<
      string,
      unknown
    >,
  );
  const parsed = JSON.parse(decodedArtifactJson(request)) as Record<string, unknown>;

  it("carries the normalized request without the verbose raw copy", () => {
    expect(parsed["kind"]).toBe("presentation-request");
    expect(parsed["queryLanguage"]).toBe("dcql");
    expect(parsed["raw"]).toBeUndefined();
    expect(Array.isArray(parsed["credentials"])).toBe(true);
  });
});
