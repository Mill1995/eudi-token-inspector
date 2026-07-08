# ADR 0004 — Trust list source model

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

There is no single authoritative EU-wide SD-JWT-VC _issuer_ trust list in
production (as of 2026-07). eIDAS LOTL is XML and QTSP-oriented; pilots
(POTENTIAL and other LSPs) each run their own issuer registries. Overclaiming to
be an authoritative trust oracle is also the liability the product wants to avoid.

## Decision

The inspector is a **configurable trust checker**, not a trust authority:

- **Primary**: user-supplied trust anchors — paste/import issuer certs, a JWKS,
  or an eIDAS trusted-list URL.
- **Bundled**: a small **curated snapshot** of well-known pilot/test issuers
  (EU reference implementation, walt.id demo, known LSP-pilot issuers).
- Every trust result is labeled **informational — not an authoritative trust
  decision.**

eIDAS LOTL XML parsing is explicitly deferred (candidate for v2 / team features).

## Consequences

- Honest and flexible; matches the "no liability for a wrong verification
  decision" positioning.
- The curated snapshot needs occasional maintenance; keep it as a reviewed data
  file, small and sourced.
- "Trust anchor" import is a real UI surface — design it as a first-class panel.
