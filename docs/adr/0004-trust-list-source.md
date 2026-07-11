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

eIDAS LOTL XML parsing is explicitly deferred (candidate for v2).

## Consequences

- Honest and flexible; matches the "no liability for a wrong verification
  decision" positioning.
- The curated snapshot needs occasional maintenance; keep it as a reviewed data
  file, small and sourced.
- "Trust anchor" import is a real UI surface — design it as a first-class panel.

## Update (2026-07-09) — what shipped

- **Import** accepts a pasted **JWKS or bare JWK** only
  (`src/trust/importAnchors.ts`, `src/inspector/TrustPanel.tsx`). Issuer certs
  (PEM/`x5c`) and eIDAS trusted-list URLs are deferred; LOTL stays v2.
- The **bundled snapshot** ships with a **single** anchor — the inspector's own
  reference issuer (`src/trust/snapshot.json`). The EU-reference / walt.id / LSP
  pilot anchors are not yet sourced; they are added as reviewed entries land.
- Matching is by issuer identifier, else by RFC 7638 key thumbprint. A trust
  result is `trusted` or `unknown` — there is no `untrusted` verdict — and is
  independent of signature verification (trust ≠ authenticity), keeping the
  "informational, not authoritative" framing structural.
