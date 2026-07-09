import { useCallback, useEffect, useMemo, useState } from "react";

import type { Check, Credential, PresentationRequest } from "@/domain/types";
import { decodeArtifact, type DecodeResult, type Example, parseIssuerKey } from "@/inspector/model";
import { evaluateOverasking } from "@/overasking/engine";
import { DEFAULT_OVERASKING_RULES } from "@/overasking/rules";
import type { OveraskingFinding, OveraskingRule } from "@/overasking/types";
import { checkIssuerTrust } from "@/trust/checkIssuer";
import { parseTrustAnchors } from "@/trust/importAnchors";
import { CURATED_ANCHORS } from "@/trust/snapshot";
import type { TrustResult } from "@/trust/types";
import { verifyCredential } from "@/verify/verifyCredential";

function currentUnixSeconds(): string {
  return String(Math.floor(Date.now() / 1000));
}

/** One overasking rule paired with whether it is currently active (in-session toggle). */
export interface RuleState {
  readonly rule: OveraskingRule;
  readonly enabled: boolean;
}

/** The editable inputs of the inspector: the artifact and the verifier-supplied context. */
export interface InspectorState {
  readonly input: string;
  readonly issuerKeyText: string;
  readonly expectedAudience: string;
  readonly expectedNonce: string;
  readonly verificationTime: string;
  /** Extra trust anchors pasted as a JWKS/JWK, merged with the curated snapshot (ADR 0004). */
  readonly anchorImport: string;
}

/** Everything the inspector panes read and drive. */
export interface Inspector {
  readonly state: InspectorState;
  readonly setField: (field: keyof InspectorState, value: string) => void;
  readonly loadExample: (example: Example) => void;
  readonly clear: () => void;
  /** Decode outcome, or null while the artifact box is empty (the empty state). */
  readonly decode: DecodeResult | null;
  /** Verification checks for a credential; null before one decodes or when the artifact is a request. */
  readonly checks: readonly Check[] | null;
  readonly verifying: boolean;
  /** Informational issuer-trust result for a credential; null before one decodes or for a request. */
  readonly trust: TrustResult | null;
  /** Overasking findings for a presentation request; null when the artifact is not a request. */
  readonly overasking: readonly OveraskingFinding[] | null;
  /** Every overasking rule with its current enabled flag, for the visible/editable rules panel. */
  readonly ruleStates: readonly RuleState[];
  readonly toggleRule: (id: string) => void;
}

function emptyState(): InspectorState {
  return {
    input: "",
    issuerKeyText: "",
    expectedAudience: "",
    expectedNonce: "",
    verificationTime: currentUnixSeconds(),
    anchorImport: "",
  };
}

function initialEnabledRuleIds(): ReadonlySet<string> {
  return new Set(DEFAULT_OVERASKING_RULES.map((rule) => rule.id));
}

function credentialOf(decode: DecodeResult | null): Credential | undefined {
  return decode?.ok === true && decode.artifact.kind === "credential" ? decode.artifact : undefined;
}

function requestOf(decode: DecodeResult | null): PresentationRequest | null {
  return decode?.ok === true && decode.artifact.kind === "presentation-request"
    ? decode.artifact
    : null;
}

/** Drive the inspector: paste/edit an artifact, decode locally, then verify a credential or flag overasking. */
export function useInspector(): Inspector {
  const [state, setState] = useState<InspectorState>(emptyState);
  const [checks, setChecks] = useState<readonly Check[] | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [trust, setTrust] = useState<TrustResult | null>(null);
  const [enabledRuleIds, setEnabledRuleIds] = useState<ReadonlySet<string>>(initialEnabledRuleIds);

  const setField = useCallback(
    (field: keyof InspectorState, value: string) =>
      setState((prev) => ({ ...prev, [field]: value })),
    [],
  );
  const loadExample = useCallback(
    (example: Example) =>
      setState({
        input: example.input,
        issuerKeyText: example.issuerKeyText,
        expectedAudience: example.expectedAudience,
        expectedNonce: example.expectedNonce,
        verificationTime: example.verificationTime || currentUnixSeconds(),
        anchorImport: "",
      }),
    [],
  );
  const clear = useCallback(() => setState(emptyState()), []);
  const toggleRule = useCallback((id: string) => {
    setEnabledRuleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const decode = useMemo<DecodeResult | null>(
    () => (state.input.trim() === "" ? null : decodeArtifact(state.input)),
    [state.input],
  );
  const credential = credentialOf(decode);
  const request = requestOf(decode);

  const ruleStates = useMemo<readonly RuleState[]>(
    () => DEFAULT_OVERASKING_RULES.map((rule) => ({ rule, enabled: enabledRuleIds.has(rule.id) })),
    [enabledRuleIds],
  );
  const overasking = useMemo<readonly OveraskingFinding[] | null>(() => {
    if (request === null) return null;
    const active = DEFAULT_OVERASKING_RULES.filter((rule) => enabledRuleIds.has(rule.id));
    return evaluateOverasking(request, active);
  }, [request, enabledRuleIds]);

  const { issuerKeyText, expectedAudience, expectedNonce, verificationTime, anchorImport } = state;

  useEffect(() => {
    if (credential === undefined) {
      setTrust(null);
      return undefined;
    }
    let cancelled = false;
    const anchors = [...CURATED_ANCHORS, ...parseTrustAnchors(anchorImport)];
    checkIssuerTrust({ credential, issuerKey: parseIssuerKey(issuerKeyText), anchors })
      .then((result) => {
        if (!cancelled) setTrust(result);
      })
      .catch(() => {
        if (!cancelled) setTrust(null);
      });
    return () => {
      cancelled = true;
    };
  }, [credential, issuerKeyText, anchorImport]);

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

  return {
    state,
    setField,
    loadExample,
    clear,
    decode,
    checks,
    verifying,
    trust,
    overasking,
    ruleStates,
    toggleRule,
  };
}
