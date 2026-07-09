import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TrustBasis, TrustResult } from "@/trust/types";

const BASIS_LABELS: Record<TrustBasis, string> = {
  "issuer-id": "matched by issuer identifier",
  "key-thumbprint": "matched by key thumbprint",
};

function AnchorImport({
  anchorImport,
  onImportChange,
}: {
  anchorImport: string;
  onImportChange: (value: string) => void;
}): React.JSX.Element {
  return (
    <details className="group border-t pt-3">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium select-none">
        Add trust anchors (paste a JWKS or JWK)
      </summary>
      <div className="flex flex-col gap-1.5 pt-3">
        <Label htmlFor="anchor-import">Trust anchors</Label>
        <Textarea
          id="anchor-import"
          value={anchorImport}
          onChange={(event) => onImportChange(event.target.value)}
          placeholder='{ "keys": [ { "kty": "OKP", "crv": "Ed25519", "x": "…" } ] }'
          className="min-h-20 resize-y font-mono text-xs break-all"
          spellCheck={false}
        />
        <p className="text-muted-foreground text-xs">
          Pasted keys are matched against the issuer&rsquo;s signing key by thumbprint. Nothing is
          sent anywhere.
        </p>
      </div>
    </details>
  );
}

function TrustBody({ trust }: { trust: TrustResult }): React.JSX.Element {
  const issuer = trust.issuer === "" ? "(no iss claim)" : trust.issuer;
  if (trust.status === "trusted" && trust.anchor !== undefined) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{trust.anchor.label}</span>
          <Badge variant="outline" className="border-brand/25 bg-brand/10 text-brand">
            Trusted
          </Badge>
        </div>
        <p className="text-muted-foreground font-mono text-xs break-all">{issuer}</p>
        <p className="text-muted-foreground text-xs">
          {trust.basis !== undefined && `${BASIS_LABELS[trust.basis]} · `}
          {trust.anchor.source}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">Not in your trust anchors</span>
        <Badge variant="outline" className="border-skip/25 bg-skip/10 text-skip">
          Unknown
        </Badge>
      </div>
      <p className="text-muted-foreground font-mono text-xs break-all">{issuer}</p>
      <p className="text-muted-foreground text-xs">
        Paste the issuer&rsquo;s JWKS below to check it against a key you trust.
      </p>
    </div>
  );
}

interface TrustPanelProps {
  readonly trust: TrustResult | null;
  readonly anchorImport: string;
  readonly onImportChange: (value: string) => void;
}

/** The issuer-trust pane (ADR 0004): an informational trusted/unknown result plus anchor import. */
export function TrustPanel({
  trust,
  anchorImport,
  onImportChange,
}: TrustPanelProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Issuer trust</CardTitle>
        <CardDescription>Informational — not an authoritative trust decision.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {trust !== null ? (
          <TrustBody trust={trust} />
        ) : (
          <p className="text-muted-foreground text-sm">
            The trust check runs once a credential decodes.
          </p>
        )}
        <AnchorImport anchorImport={anchorImport} onImportChange={onImportChange} />
      </CardContent>
    </Card>
  );
}
