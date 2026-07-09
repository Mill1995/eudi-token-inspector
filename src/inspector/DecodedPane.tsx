import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Credential, Disclosure } from "@/domain/types";
import type { DecodeResult } from "@/inspector/model";

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

function CredentialView({ credential }: { credential: Credential }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <Segment accent="bg-seg-issuer" title="Issuer JWT" hint="issuer-signed">
        <JsonBlock value={credential.issuerJwt.header} />
        <JsonBlock value={credential.issuerJwt.payload} />
      </Segment>

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

/** The decode pane: the artifact split into its issuer JWT, disclosures, and KB-JWT segments. */
export function DecodedPane({ decode }: { decode: DecodeResult }): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Decoded</CardTitle>
        <CardDescription>Everything is parsed locally — nothing is sent anywhere.</CardDescription>
      </CardHeader>
      <CardContent>
        {decode.ok ? (
          <CredentialView credential={decode.credential} />
        ) : (
          <p className="text-fail text-sm">Couldn&rsquo;t decode this artifact: {decode.error}</p>
        )}
      </CardContent>
    </Card>
  );
}
