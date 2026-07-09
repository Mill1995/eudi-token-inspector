import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EXAMPLES } from "@/inspector/model";
import type { Inspector } from "@/inspector/useInspector";

function ContextField({
  id,
  label,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="font-mono"
      />
    </div>
  );
}

/** The input pane: paste an artifact, load an example, and supply optional verification context. */
export function InputPane({ inspector }: { inspector: Inspector }): React.JSX.Element {
  const { state, setField, loadExample, clear } = inspector;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Artifact</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Textarea
          aria-label="Artifact"
          value={state.input}
          onChange={(event) => setField("input", event.target.value)}
          placeholder="Paste an SD-JWT VC (issuer-jwt~disclosure…~kb-jwt) or an OpenID4VP request"
          className="min-h-40 resize-y font-mono text-xs break-all"
          spellCheck={false}
        />

        <div className="flex flex-col gap-2">
          <Label>Load an example</Label>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((example) => (
              <Button
                key={example.id}
                type="button"
                variant="outline"
                size="sm"
                title={example.description}
                onClick={() => loadExample(example)}
                className="font-mono text-xs"
              >
                {example.id}
              </Button>
            ))}
          </div>
        </div>

        <details className="group border-t pt-3">
          <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium select-none">
            Verification context
          </summary>
          <div className="flex flex-col gap-3 pt-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="issuer-key">Issuer public key (JWK or JWKS)</Label>
              <Textarea
                id="issuer-key"
                value={state.issuerKeyText}
                onChange={(event) => setField("issuerKeyText", event.target.value)}
                placeholder='{ "kty": "OKP", "crv": "Ed25519", "x": "…" }'
                className="min-h-20 resize-y font-mono text-xs break-all"
                spellCheck={false}
              />
            </div>
            <ContextField
              id="expected-aud"
              label="Expected audience"
              value={state.expectedAudience}
              placeholder="https://verifier.example"
              onChange={(value) => setField("expectedAudience", value)}
            />
            <ContextField
              id="expected-nonce"
              label="Expected nonce"
              value={state.expectedNonce}
              placeholder="the challenge you issued"
              onChange={(value) => setField("expectedNonce", value)}
            />
            <ContextField
              id="verification-time"
              label="Verification time (unix seconds)"
              value={state.verificationTime}
              placeholder="now"
              onChange={(value) => setField("verificationTime", value)}
            />
            <p className="text-muted-foreground text-xs">
              No key resolves to skip, not fail (ADR 0003). Leave a field blank and its check is
              skipped.
            </p>
          </div>
        </details>

        {state.input !== "" && (
          <Button type="button" variant="ghost" size="sm" onClick={clear} className="self-start">
            Clear
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
