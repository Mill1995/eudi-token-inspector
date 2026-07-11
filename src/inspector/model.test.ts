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

function b64u(value: unknown): string {
  return btoa(JSON.stringify(value)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

const REQUEST_PAYLOAD = {
  nonce: "n",
  dcql_query: { credentials: [{ id: "pid", claims: [{ path: ["age_over_18"] }] }] },
};

describe("decodeArtifact accepts the OpenID4VP request shapes wallets actually receive", () => {
  it("unwraps a JAR request object delivered by value ({ request: <jwt> })", () => {
    const jwt = `${b64u({ alg: "ES256", typ: "oauth-authz-req+jwt" })}.${b64u(REQUEST_PAYLOAD)}.AA`;
    const result = decodeArtifact(JSON.stringify({ request: jwt }));
    expect(result.ok && result.artifact.kind).toBe("presentation-request");
  });

  it("decodes a bare signed request object JWT (not misread as a credential)", () => {
    const jwt = `${b64u({ alg: "ES256", typ: "oauth-authz-req+jwt" })}.${b64u(REQUEST_PAYLOAD)}.AA`;
    const result = decodeArtifact(jwt);
    expect(result.ok && result.artifact.kind).toBe("presentation-request");
  });

  it("explains that a request_uri cannot be followed (no network calls)", () => {
    const result = decodeArtifact(
      JSON.stringify({ request_uri: "https://verifier.example/req/1" }),
    );
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.error).toMatch(/request_uri|network/i);
  });
});
