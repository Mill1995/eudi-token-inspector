import { describe, expect, it } from "vitest";

import { sdJwtFixtures } from "@/fixtures";
import { openId4VpFixtures } from "@/fixtures";
import { decodeArtifact } from "@/inspector/model";

describe("decodeArtifact detects the artifact kind from pasted input", () => {
  it("decodes a compact SD-JWT VC as a credential", () => {
    const compact = sdJwtFixtures.find((f) => f.id === "good-presentation")!.compact;
    const result = decodeArtifact(compact);
    expect(result.ok).toBe(true);
    expect(result.ok && result.artifact.kind).toBe("credential");
  });

  it("decodes a pasted OpenID4VP request JSON as a presentation request", () => {
    const request = openId4VpFixtures.find((f) => f.id === "overasking-request-dcql")!.request;
    const result = decodeArtifact(JSON.stringify(request));
    expect(result.ok).toBe(true);
    expect(result.ok && result.artifact.kind).toBe("presentation-request");
  });

  it("reports an error for input that is neither", () => {
    const result = decodeArtifact("not an artifact");
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error.length).toBeGreaterThan(0);
  });
});
