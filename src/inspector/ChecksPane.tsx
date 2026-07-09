import { Check as CheckIcon, Minus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Check, CheckId, CheckOutcome } from "@/domain/types";

const CHECK_LABELS: Record<CheckId, string> = {
  "issuer-signature": "Issuer signature",
  "key-binding-signature": "Key-binding signature",
  "sd-hash": "Disclosure seal (sd_hash)",
  temporal: "Validity window",
  audience: "Audience binding",
  nonce: "Nonce binding",
};

const OUTCOME_META = {
  pass: { variant: "pass", Icon: CheckIcon, label: "Pass" },
  fail: { variant: "fail", Icon: X, label: "Fail" },
  skip: { variant: "skip", Icon: Minus, label: "Skip" },
} as const;

function CheckRow({ check }: { check: Check }): React.JSX.Element {
  const meta = OUTCOME_META[check.outcome];
  return (
    <li className="flex flex-col gap-1 border-t py-3 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{CHECK_LABELS[check.id]}</span>
        <Badge variant={meta.variant}>
          <meta.Icon aria-hidden />
          {meta.label}
        </Badge>
      </div>
      <p className="text-muted-foreground text-xs">{check.reason}</p>
    </li>
  );
}

function summarize(checks: readonly Check[]): string {
  const count = (outcome: CheckOutcome): number =>
    checks.filter((check) => check.outcome === outcome).length;
  return `${count("pass")} pass · ${count("fail")} fail · ${count("skip")} skip`;
}

interface ChecksPaneProps {
  readonly checks: readonly Check[] | null;
  readonly verifying: boolean;
  readonly hasArtifact: boolean;
}

/** The verification pane: one pass/fail/skip badge per ADR-0002 check, each with its reason. */
export function ChecksPane({ checks, verifying, hasArtifact }: ChecksPaneProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Checks</CardTitle>
        <CardDescription>
          {checks !== null ? summarize(checks) : "Local verification (ADR 0002)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {checks !== null ? (
          <ul>
            {checks.map((check) => (
              <CheckRow key={check.id} check={check} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            {hasArtifact && verifying
              ? "Verifying…"
              : "Checks appear once an artifact decodes. A check is skip when it has no input to decide — never a silent fail."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
