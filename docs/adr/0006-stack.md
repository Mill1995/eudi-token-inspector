# ADR 0006 — Stack

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

The app is a static, client-only SPA (ADR 0003) doing browser crypto (ADR 0002)
with a slick single-purpose UX as its whole reason to exist. `@credo-ts` (used in
eudi-solana) is node-only via a native askar binding and cannot run in-browser.

## Decision

- **Framework**: Vite + React + TypeScript + Tailwind + **shadcn/ui** — the same
  stack as the Portfolio hub, so it slots into the "presents" site and reuses
  known tooling.
- **SD-JWT**: ~~`@sd-jwt/sd-jwt-vc` (the sd-jwt-js family)~~ — **superseded** (see
  Update below): decode, KB-JWT, and `sd_hash` are hand-rolled over WebCrypto.
- **Crypto**: WebCrypto (ES256 / EdDSA / ES384) for signature verification.
- **OpenID4VP request**: parsed directly as JSON (presentation_definition / PEX
  and DCQL).
- **Quality gates**: oxlint + oxfmt + `tsc --noEmit` (strict) + vitest, per the
  global standards. Exact-pinned deps.

## Consequences

- Fast path to a polished tool; consistent with the rest of the workspace.
- mdoc (v2) will need CBOR/COSE libs; keep the domain layer format-agnostic so
  adding them doesn't churn the UI.

## Update (2026-07-09) — no `@sd-jwt` dependency

Phase 2 implemented decode + KB-JWT + `sd_hash` directly (`src/domain/`,
`src/verify/`) rather than adopting `@sd-jwt/sd-jwt-vc`. The risk-table fallback
in `plans/ROADMAP.md` ("fall back to raw WebCrypto for sig verify") was taken for
the whole SD-JWT layer: the decode is small and the tests already hand-rolled it,
so the dependency earned nothing. This removes a dependency (attack surface +
maintenance) at the cost of owning the SD-JWT parsing — acceptable and covered by
the fixture-driven tests. The trust layer's RFC 7638 thumbprint (Phase 4) is
likewise hand-rolled over WebCrypto.
