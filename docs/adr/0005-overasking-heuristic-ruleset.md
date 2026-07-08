# ADR 0005 — Overasking as a transparent heuristic ruleset

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

"Overasking" (a verifier demanding more than it needs) is the most
differentiating feature and the most subjective. "Necessary" has no universal
baseline. A purpose→claims policy catalog would be principled but doesn't exist
as a standard and would be a maintenance burden.

## Decision

Ship a **transparent, data-driven heuristic ruleset**. Rules live as editable,
user-visible data (JSON); each fired rule shows a **severity** and a
**rationale**. Results are **advisory**, never a verdict. Seed rules:

- Requests **exact `birth_date`** when an `age_over_NN` / `age_in_years`
  assertion would satisfy the stated need.
- Requests **portrait/photo** in a non-in-person (remote) flow.
- Requests a **unique identifier** (`document_number`, administrative number)
  that maximises linkability.
- Requests the **entire PID / whole credential** rather than named claims.
- Requests a **sensitive claim with no stated `purpose`**.

## Consequences

- No ML and no external service — runs fully client-side, fits the privacy story.
- Rules-as-data means users can extend/override, and CI rule packs become a
  natural paid "team features" extension later.
- Must be framed as advice; the UI copy must not imply legal judgment.
- Rules need a small, documented catalog with rationale references (GDPR data
  minimisation, EUDI ARF selective disclosure guidance).
