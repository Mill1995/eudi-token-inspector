import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RuleState } from "@/inspector/useInspector";
import type { OveraskingFinding } from "@/overasking/types";
import type { OveraskingSeverity } from "@/overasking/types";

const SEVERITY_CLASS: Record<OveraskingSeverity, string> = {
  high: "border-fail/25 bg-fail/10 text-fail",
  medium: "border-brand/25 bg-brand/10 text-brand",
  low: "border-skip/25 bg-skip/10 text-skip",
};

function SeverityBadge({ severity }: { severity: OveraskingSeverity }): React.JSX.Element {
  return (
    <Badge variant="outline" className={SEVERITY_CLASS[severity]}>
      {severity}
    </Badge>
  );
}

function FindingRow({ finding }: { finding: OveraskingFinding }): React.JSX.Element {
  const claimList = finding.matchedClaims.map((claim) => claim.path.join(".")).join(", ");
  const matched = claimList === "" ? "the entire credential (no specific claims named)" : claimList;
  return (
    <li className="flex flex-col gap-1 border-t py-3 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{finding.rule.title}</span>
        <SeverityBadge severity={finding.rule.severity} />
      </div>
      <p className="text-muted-foreground text-xs">{finding.rule.rationale}</p>
      <p className="text-xs">
        <span className="text-muted-foreground">Triggered by </span>
        <span className="font-mono break-all">{matched}</span>
      </p>
    </li>
  );
}

function RulesPanel({
  ruleStates,
  toggleRule,
}: {
  ruleStates: readonly RuleState[];
  toggleRule: (id: string) => void;
}): React.JSX.Element {
  const enabled = ruleStates.filter((state) => state.enabled).length;
  return (
    <details className="group border-t pt-3">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs font-medium select-none">
        Rules ({enabled}/{ruleStates.length} on) — toggle to re-evaluate
      </summary>
      <ul className="flex flex-col gap-3 pt-3">
        {ruleStates.map(({ rule, enabled: isOn }) => (
          <li key={rule.id}>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={isOn}
                onChange={() => toggleRule(rule.id)}
                className="mt-0.5"
              />
              <span className="flex flex-col gap-0.5">
                <span className="flex items-center gap-2">
                  <span className="text-xs font-medium">{rule.title}</span>
                  <SeverityBadge severity={rule.severity} />
                </span>
                <span className="text-muted-foreground font-mono text-[0.7rem] break-all">
                  {rule.id}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </details>
  );
}

interface OveraskingPaneProps {
  readonly overasking: readonly OveraskingFinding[];
  readonly ruleStates: readonly RuleState[];
  readonly toggleRule: (id: string) => void;
}

/** The overasking pane for a Presentation Request: advisory findings plus the visible/editable rules. */
export function OveraskingPane({
  overasking,
  ruleStates,
  toggleRule,
}: OveraskingPaneProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overasking</CardTitle>
        <CardDescription>
          {overasking.length > 0
            ? `${overasking.length} rule${overasking.length === 1 ? "" : "s"} fired — advisory, never a verdict`
            : "Advisory data-minimisation read — never a verdict"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {overasking.length > 0 ? (
          <ul>
            {overasking.map((finding) => (
              <FindingRow key={finding.rule.id} finding={finding} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            No overasking rules fired — this request looks proportionate to its stated purpose.
          </p>
        )}
        <RulesPanel ruleStates={ruleStates} toggleRule={toggleRule} />
      </CardContent>
    </Card>
  );
}
