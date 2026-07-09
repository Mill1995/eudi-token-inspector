import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChecksPane } from "@/inspector/ChecksPane";
import { DecodedPane } from "@/inspector/DecodedPane";
import { InputPane } from "@/inspector/InputPane";
import { OveraskingPane } from "@/inspector/OveraskingPane";
import { TrustPanel } from "@/inspector/TrustPanel";
import { useInspector } from "@/inspector/useInspector";

function DecodedPlaceholder(): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Decoded</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          Paste an artifact or load an example to see its header, payload, and every disclosure
          resolved.
        </p>
      </CardContent>
    </Card>
  );
}

/** The right pane follows the artifact: verification checks for a credential, overasking for a request. */
function AnalysisPane({
  inspector,
}: {
  inspector: ReturnType<typeof useInspector>;
}): React.JSX.Element {
  if (inspector.overasking !== null) {
    return (
      <OveraskingPane
        overasking={inspector.overasking}
        ruleStates={inspector.ruleStates}
        toggleRule={inspector.toggleRule}
      />
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <ChecksPane
        checks={inspector.checks}
        verifying={inspector.verifying}
        hasArtifact={inspector.decode?.ok === true}
      />
      <TrustPanel
        trust={inspector.trust}
        anchorImport={inspector.state.anchorImport}
        onImportChange={(value) => inspector.setField("anchorImport", value)}
      />
    </div>
  );
}

/** The three-pane inspector: input · decoded · analysis (checks or overasking). */
export function Inspector(): React.JSX.Element {
  const inspector = useInspector();
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)]">
      <InputPane inspector={inspector} />
      {inspector.decode !== null ? (
        <DecodedPane decode={inspector.decode} />
      ) : (
        <DecodedPlaceholder />
      )}
      <AnalysisPane inspector={inspector} />
    </div>
  );
}
