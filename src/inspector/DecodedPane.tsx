import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  Artifact,
  Credential,
  Disclosure,
  PresentationRequest,
  RequestedCredential,
} from "@/domain/types";
import type { DecodeResult } from "@/inspector/model";
import { decodedArtifactJson } from "@/inspector/share";

const QUERY_LANGUAGE_LABELS: Record<PresentationRequest["queryLanguage"], string> = {
  dcql: "DCQL",
  "presentation-exchange": "Presentation Exchange",
};

function JsonBlock({ value }: { value: unknown }): React.JSX.Element {
  return (
    <pre className="bg-muted/50 overflow-x-auto rounded-md p-3 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function Segment({
  accent,
  title,
  hint,
  children,
}: {
  accent: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="flex flex-col gap-2 border-t pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-baseline gap-2">
        <span className={`size-2 shrink-0 translate-y-px rounded-full ${accent}`} aria-hidden />
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-muted-foreground text-xs">{hint}</span>
      </div>
      {children}
    </section>
  );
}

function DisclosureRow({ disclosure }: { disclosure: Disclosure }): React.JSX.Element {
  return (
    <li className="flex flex-col gap-0.5 font-mono text-xs">
      <div className="break-all">
        <span className="text-seg-disclosure font-semibold">
          {disclosure.claimName ?? "(array element)"}
        </span>
        <span className="text-muted-foreground"> = </span>
        <span>{JSON.stringify(disclosure.value)}</span>
      </div>
      <span className="text-muted-foreground/70 break-all">salt {disclosure.salt}</span>
    </li>
  );
}

function CredentialView({
  credential,
  resolved,
}: {
  credential: Credential;
  resolved: Readonly<Record<string, unknown>> | null;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Segment accent="bg-seg-issuer" title="Issuer JWT" hint="issuer-signed">
        <JsonBlock value={credential.issuerJwt.header} />
        <JsonBlock value={credential.issuerJwt.payload} />
      </Segment>

      {resolved !== null && (
        <Segment accent="bg-seg-disclosure" title="Resolved claims" hint="disclosures applied">
          <JsonBlock value={resolved} />
        </Segment>
      )}

      <Segment
        accent="bg-seg-disclosure"
        title="Disclosures"
        hint={`${credential.disclosures.length} shown`}
      >
        {credential.disclosures.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {credential.disclosures.map((disclosure) => (
              <DisclosureRow key={disclosure.raw} disclosure={disclosure} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-xs">No disclosures presented.</p>
        )}
      </Segment>

      {credential.kbJwt !== undefined && (
        <Segment accent="bg-seg-kb" title="Key-Binding JWT" hint="holder-signed">
          <JsonBlock value={credential.kbJwt.jws.header} />
          <JsonBlock value={credential.kbJwt.jws.payload} />
        </Segment>
      )}
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5 font-mono text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="break-all">{value}</span>
    </div>
  );
}

function requestedCredentialKey(credential: RequestedCredential, index: number): string {
  return (
    credential.id ??
    (credential.claims.map((claim) => claim.path.join(".")).join("|") || `cred-${index}`)
  );
}

function RequestedCredentialRow({
  credential,
}: {
  credential: RequestedCredential;
}): React.JSX.Element {
  return (
    <li className="flex flex-col gap-1.5">
      {credential.vctValues !== undefined && (
        <div className="font-mono text-xs">
          <span className="text-muted-foreground">type </span>
          <span className="break-all">{credential.vctValues.join(", ")}</span>
        </div>
      )}
      {credential.claims.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {credential.claims.map((claim) => (
            <li key={claim.path.join(".")} className="font-mono text-xs break-all">
              <span className="text-seg-disclosure font-semibold">{claim.path.join(".")}</span>
              {claim.constrainedTo !== undefined && (
                <>
                  <span className="text-muted-foreground"> = </span>
                  <span>{JSON.stringify(claim.constrainedTo)}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-xs">
          No named claims — the whole credential is requested.
        </p>
      )}
    </li>
  );
}

function RequestView({ request }: { request: PresentationRequest }): React.JSX.Element {
  const claimCount = request.credentials.reduce((total, cred) => total + cred.claims.length, 0);
  return (
    <div className="flex flex-col gap-4">
      <Segment
        accent="bg-seg-issuer"
        title="Request"
        hint={QUERY_LANGUAGE_LABELS[request.queryLanguage]}
      >
        <div className="grid grid-cols-2 gap-3">
          <MetaRow label="flow" value={request.flow} />
          {request.clientId !== undefined && <MetaRow label="client_id" value={request.clientId} />}
          {request.nonce !== undefined && <MetaRow label="nonce" value={request.nonce} />}
        </div>
        {request.purpose !== undefined && <MetaRow label="purpose" value={request.purpose} />}
      </Segment>

      <Segment accent="bg-seg-disclosure" title="Requested claims" hint={`${claimCount} requested`}>
        <ul className="flex flex-col gap-3">
          {request.credentials.map((credential, index) => (
            <RequestedCredentialRow
              key={requestedCredentialKey(credential, index)}
              credential={credential}
            />
          ))}
        </ul>
      </Segment>
    </div>
  );
}

function CopyButton({ artifact }: { artifact: Artifact }): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const onCopy = (): void => {
    navigator.clipboard
      .writeText(decodedArtifactJson(artifact))
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // Clipboard unavailable (permission denied / insecure context) — nothing to recover.
      });
  };
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onCopy}
      aria-label="Copy the decoded view as JSON"
    >
      {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

/** The decode pane: the artifact split into its segments — a credential's parts or a request's ask. */
export function DecodedPane({
  decode,
  resolved,
}: {
  decode: DecodeResult;
  resolved: Readonly<Record<string, unknown>> | null;
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Decoded</CardTitle>
            <CardDescription>
              Everything is parsed locally — nothing is sent anywhere.
            </CardDescription>
          </div>
          {decode.ok && <CopyButton artifact={decode.artifact} />}
        </div>
      </CardHeader>
      <CardContent>
        {!decode.ok ? (
          <p className="text-fail text-sm">Couldn&rsquo;t decode this artifact: {decode.error}</p>
        ) : decode.artifact.kind === "credential" ? (
          <CredentialView credential={decode.artifact} resolved={resolved} />
        ) : (
          <RequestView request={decode.artifact} />
        )}
      </CardContent>
    </Card>
  );
}
