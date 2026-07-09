import { useCallback, useEffect, useMemo, useState } from "react";

import type { Check } from "@/domain/types";
import { decodeArtifact, type DecodeResult, type Example, parseIssuerKey } from "@/inspector/model";
import { verifyCredential } from "@/verify/verifyCredential";

function currentUnixSeconds(): string {
  return String(Math.floor(Date.now() / 1000));
}

/** The editable inputs of the inspector: the artifact and the verifier-supplied context. */
export interface InspectorState {
  readonly input: string;
  readonly issuerKeyText: string;
  readonly expectedAudience: string;
  readonly expectedNonce: string;
  readonly verificationTime: string;
}

/** Everything the inspector panes read and drive. */
export interface Inspector {
  readonly state: InspectorState;
  readonly setField: (field: keyof InspectorState, value: string) => void;
  readonly loadExample: (example: Example) => void;
  readonly clear: () => void;
  /** Decode outcome, or null while the artifact box is empty (the empty state). */
  readonly decode: DecodeResult | null;
  /** Verification checks once they resolve; null before an artifact decodes. */
  readonly checks: readonly Check[] | null;
  readonly verifying: boolean;
}

function emptyState(): InspectorState {
  return {
    input: "",
    issuerKeyText: "",
    expectedAudience: "",
    expectedNonce: "",
    verificationTime: currentUnixSeconds(),
  };
}

/** Drive the inspector: paste/edit inputs, decode locally, and run the ADR-0002 checks on WebCrypto. */
export function useInspector(): Inspector {
  const [state, setState] = useState<InspectorState>(emptyState);
  const [checks, setChecks] = useState<readonly Check[] | null>(null);
  const [verifying, setVerifying] = useState(false);

  const setField = useCallback(
    (field: keyof InspectorState, value: string) =>
      setState((prev) => ({ ...prev, [field]: value })),
    [],
  );
  const loadExample = useCallback(
    (example: Example) =>
      setState({
        input: example.compact,
        issuerKeyText: example.issuerKeyText,
        expectedAudience: example.expectedAudience,
        expectedNonce: example.expectedNonce,
        verificationTime: example.verificationTime,
      }),
    [],
  );
  const clear = useCallback(() => setState(emptyState()), []);

  const decode = useMemo<DecodeResult | null>(
    () => (state.input.trim() === "" ? null : decodeArtifact(state.input)),
    [state.input],
  );
  const credential = decode?.ok === true ? decode.credential : undefined;

  const { issuerKeyText, expectedAudience, expectedNonce, verificationTime } = state;
  useEffect(() => {
    if (credential === undefined) {
      setChecks(null);
      setVerifying(false);
      return undefined;
    }
    let cancelled = false;
    setVerifying(true);
    const raw = verificationTime.trim();
    const parsed = raw === "" ? Number.NaN : Number(raw);
    const nowSeconds = Number.isFinite(parsed) ? parsed : Math.floor(Date.now() / 1000);
    const run = async (): Promise<void> => {
      try {
        const result = await verifyCredential({
          credential,
          nowSeconds,
          issuerKey: parseIssuerKey(issuerKeyText),
          expectedAudience: expectedAudience.trim() === "" ? undefined : expectedAudience.trim(),
          expectedNonce: expectedNonce.trim() === "" ? undefined : expectedNonce.trim(),
        });
        if (!cancelled) {
          setChecks(result.checks);
          setVerifying(false);
        }
      } catch {
        if (!cancelled) {
          setChecks(null);
          setVerifying(false);
        }
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [credential, issuerKeyText, expectedAudience, expectedNonce, verificationTime]);

  return { state, setField, loadExample, clear, decode, checks, verifying };
}
