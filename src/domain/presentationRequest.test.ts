import { describe, expect, it } from "vitest";

import { decodePresentationRequest } from "@/domain/presentationRequest";
import { openId4VpFixtures } from "@/fixtures";

function fixtureRequest(id: string): Record<string, unknown> {
  const fixture = openId4VpFixtures.find((f) => f.id === id);
  if (fixture === undefined) throw new Error(`no OpenID4VP fixture "${id}"`);
  return fixture.request as Record<string, unknown>;
}

function claimPaths(credentials: ReturnType<typeof decodePresentationRequest>["credentials"]) {
  return credentials.flatMap((credential) => credential.claims.map((claim) => claim.path));
}

describe("decodePresentationRequest normalizes a DCQL query", () => {
  const request = decodePresentationRequest(fixtureRequest("overasking-request-dcql"));

  it("records the query language and remote flow", () => {
    expect(request.kind).toBe("presentation-request");
    expect(request.queryLanguage).toBe("dcql");
    expect(request.flow).toBe("remote");
  });

  it("carries the verifier context", () => {
    expect(request.clientId).toBe("https://bar.example");
    expect(request.nonce).toBe("n-0S6_WzA2Mj");
    expect(request.purpose).toBe("Confirm you are over 18 to enter");
  });

  it("normalizes the requested claims and pins the credential type", () => {
    expect(request.credentials).toHaveLength(1);
    expect(request.credentials[0]?.vctValues).toEqual(["urn:eudi:pid:1"]);
    expect(claimPaths(request.credentials)).toEqual([
      ["birthdate"],
      ["portrait"],
      ["document_number"],
    ]);
  });
});

describe("decodePresentationRequest normalizes a Presentation Exchange definition", () => {
  const request = decodePresentationRequest(fixtureRequest("request-pex"));

  it("records the query language", () => {
    expect(request.queryLanguage).toBe("presentation-exchange");
    expect(request.purpose).toBe("Confirm you are over 18 to enter");
  });

  it("treats a `vct` const field as the credential type, not a requested claim", () => {
    expect(request.credentials[0]?.vctValues).toEqual(["urn:eudi:pid:1"]);
    expect(claimPaths(request.credentials)).toEqual([["age_over_18"]]);
  });
});

describe("decodePresentationRequest normalizes both query languages to one model", () => {
  const dcql = decodePresentationRequest({
    response_mode: "direct_post",
    nonce: "n",
    dcql_query: {
      credentials: [
        {
          id: "pid",
          meta: { vct_values: ["urn:eudi:pid:1"] },
          claims: [{ path: ["age_over_18"] }],
        },
      ],
    },
  });
  const pex = decodePresentationRequest({
    response_mode: "direct_post",
    nonce: "n",
    presentation_definition: {
      id: "age",
      input_descriptors: [
        {
          id: "pid",
          constraints: {
            fields: [
              { path: ["$.vct"], filter: { type: "string", const: "urn:eudi:pid:1" } },
              { path: ["$.age_over_18"] },
            ],
          },
        },
      ],
    },
  });

  it("produces the same requested claims from equivalent DCQL and PEX asks", () => {
    expect(claimPaths(pex.credentials)).toEqual(claimPaths(dcql.credentials));
    expect(pex.credentials[0]?.vctValues).toEqual(dcql.credentials[0]?.vctValues);
  });
});

describe("decodePresentationRequest fails fast on an unknown request", () => {
  it("throws when neither a DCQL nor a PEX query is present", () => {
    expect(() => decodePresentationRequest({ response_type: "vp_token" })).toThrow(/query/i);
  });
});
