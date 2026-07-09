import type { Artifact, Credential, PresentationRequest } from "@/domain/types";

function credentialJson(credential: Credential): Record<string, unknown> {
  return {
    kind: credential.kind,
    issuer: { header: credential.issuerJwt.header, payload: credential.issuerJwt.payload },
    disclosures: credential.disclosures.map((disclosure) => ({
      ...(disclosure.claimName !== undefined && { claim: disclosure.claimName }),
      value: disclosure.value,
      salt: disclosure.salt,
    })),
    ...(credential.kbJwt !== undefined && {
      keyBinding: { header: credential.kbJwt.jws.header, payload: credential.kbJwt.jws.payload },
    }),
  };
}

function requestJson(request: PresentationRequest): Record<string, unknown> {
  return {
    kind: request.kind,
    queryLanguage: request.queryLanguage,
    flow: request.flow,
    ...(request.clientId !== undefined && { clientId: request.clientId }),
    ...(request.nonce !== undefined && { nonce: request.nonce }),
    ...(request.purpose !== undefined && { purpose: request.purpose }),
    credentials: request.credentials,
  };
}

/**
 * Serialize a decoded artifact to shareable, pretty-printed JSON. The request view drops the verbose
 * `raw` copy. This is the only "share" primitive — the artifact is never encoded into a URL, so no
 * pasted data can leak through a shared link (ADR 0003 privacy stance).
 */
export function decodedArtifactJson(artifact: Artifact): string {
  const view = artifact.kind === "credential" ? credentialJson(artifact) : requestJson(artifact);
  return JSON.stringify(view, null, 2);
}
