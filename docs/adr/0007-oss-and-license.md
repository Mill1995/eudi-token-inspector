# ADR 0007 — Open source & license

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

The inspector is a free, open tool for the EUDI developer community. The global
philosophy forbids premature abstraction and speculative features, so the repo
should ship the tool itself and nothing built ahead of a real need.

## Decision

- **One public repo** = the entire inspector, free.
- **License: Apache-2.0** (matches eudi-solana).
- **Self-hostable** — no hidden backend (consistent with ADR 0003).
- **No monetization plumbing in v1** — no `/pro` folder, no feature flags, no
  paywall scaffolding. The tool stays free and open; any future extension would
  be a separate, additive boundary, decided if and when there is demand.

## Consequences

- Full auditability makes the "nothing leaves the browser" claim checkable —
  reinforces the core trust proposition.
- Maximises dev-tool / hackathon community goodwill (Postman-style coexistence).
- Keeping the codebase additive means a later extension is a clean new boundary,
  not a retrofit.
