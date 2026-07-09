import type {
  PresentationFlow,
  PresentationRequest,
  QueryLanguage,
  RequestedClaim,
  RequestedCredential,
} from "@/domain/types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const strings = value.filter((item): item is string => typeof item === "string");
  return strings.length > 0 ? strings : undefined;
}

/** Split a PEX JSONPath (`$.vct`, `$.age_over_18`, `$['name']`, `$.a.b`) into claim-name segments. */
function jsonPathToSegments(jsonPath: string): string[] {
  const segments: string[] = [];
  const token = /\['([^']+)'\]|\["([^"]+)"\]|\[(\d+)\]|([^.[\]]+)/g;
  for (const match of jsonPath.matchAll(token)) {
    const segment = match[1] ?? match[2] ?? match[3] ?? match[4];
    if (segment !== undefined && segment !== "$") segments.push(segment);
  }
  return segments;
}

/**
 * An OpenID4VP request delivered over HTTP is a remote flow. Proximity (in-person, ISO 18013-5 /
 * the Digital Credentials API) uses a different transport not represented here, so it is a v2 concern.
 */
const PRESENTATION_FLOW: PresentationFlow = "remote";

function purposeOf(
  request: Record<string, unknown>,
  presentationDefinition: Record<string, unknown> | undefined,
): string | undefined {
  return optionalString(request["purpose"]) ?? optionalString(presentationDefinition?.["purpose"]);
}

/** Normalize a DCQL `credentials[]` entry into the shared {@link RequestedCredential} shape. */
function dcqlCredential(raw: unknown): RequestedCredential {
  if (!isRecord(raw)) throw new Error("DCQL credential query is not an object");
  const id = optionalString(raw["id"]);
  const meta = isRecord(raw["meta"]) ? raw["meta"] : undefined;
  const vctValues = stringArray(meta?.["vct_values"]);
  const rawClaims = Array.isArray(raw["claims"]) ? raw["claims"] : [];
  const claims: RequestedClaim[] = rawClaims.flatMap((claim) => {
    if (!isRecord(claim) || !Array.isArray(claim["path"])) return [];
    return [{ path: claim["path"].map((segment) => String(segment)) }];
  });
  return { ...(id !== undefined && { id }), ...(vctValues !== undefined && { vctValues }), claims };
}

/** Normalize a PEX `input_descriptors[]` entry; a `vct` const field becomes the credential type. */
function pexCredential(raw: unknown): RequestedCredential {
  if (!isRecord(raw)) throw new Error("PEX input descriptor is not an object");
  const id = optionalString(raw["id"]);
  const constraints = isRecord(raw["constraints"]) ? raw["constraints"] : undefined;
  const fields = Array.isArray(constraints?.["fields"]) ? constraints["fields"] : [];

  const vctValues: string[] = [];
  const claims: RequestedClaim[] = [];
  for (const field of fields) {
    if (!isRecord(field) || !Array.isArray(field["path"])) continue;
    const firstPath = optionalString(field["path"][0]);
    if (firstPath === undefined) continue;
    const path = jsonPathToSegments(firstPath);
    const filter = isRecord(field["filter"]) ? field["filter"] : undefined;
    const constValue = filter?.["const"];
    if (path.at(-1) === "vct" && typeof constValue === "string") {
      vctValues.push(constValue);
      continue;
    }
    claims.push({ path, ...(constValue !== undefined && { constrainedTo: constValue }) });
  }
  return {
    ...(id !== undefined && { id }),
    ...(vctValues.length > 0 && { vctValues }),
    claims,
  };
}

function baseFields(
  request: Record<string, unknown>,
  presentationDefinition: Record<string, unknown> | undefined,
): Pick<PresentationRequest, "clientId" | "nonce" | "purpose"> {
  const clientId = optionalString(request["client_id"]);
  const nonce = optionalString(request["nonce"]);
  const purpose = purposeOf(request, presentationDefinition);
  return {
    ...(clientId !== undefined && { clientId }),
    ...(nonce !== undefined && { nonce }),
    ...(purpose !== undefined && { purpose }),
  };
}

/**
 * Decode an OpenID4VP Authorization Request into a normalized {@link PresentationRequest}. Accepts
 * either Query language — `dcql_query` (DCQL) or `presentation_definition` (Presentation Exchange) —
 * and reduces both to one requested-claims model. Throws when the request is not an object or carries
 * neither Query.
 */
export function decodePresentationRequest(raw: unknown): PresentationRequest {
  if (!isRecord(raw)) throw new Error("presentation request is not an object");

  const dcqlQuery = isRecord(raw["dcql_query"]) ? raw["dcql_query"] : undefined;
  const presentationDefinition = isRecord(raw["presentation_definition"])
    ? raw["presentation_definition"]
    : undefined;

  let queryLanguage: QueryLanguage;
  let credentials: readonly RequestedCredential[];
  if (dcqlQuery !== undefined) {
    queryLanguage = "dcql";
    const entries = Array.isArray(dcqlQuery["credentials"]) ? dcqlQuery["credentials"] : [];
    credentials = entries.map(dcqlCredential);
  } else if (presentationDefinition !== undefined) {
    queryLanguage = "presentation-exchange";
    const descriptors = Array.isArray(presentationDefinition["input_descriptors"])
      ? presentationDefinition["input_descriptors"]
      : [];
    credentials = descriptors.map(pexCredential);
  } else {
    throw new Error("request carries no query (expected dcql_query or presentation_definition)");
  }

  return {
    kind: "presentation-request",
    queryLanguage,
    flow: PRESENTATION_FLOW,
    ...baseFields(raw, presentationDefinition),
    credentials,
    raw,
  };
}
