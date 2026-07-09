# ADR 0008 — Test vectors & demo fixtures

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

Full local verification (ADR 0002) is only testable with real signed artifacts,
and the empty-state UX needs a convincing "load an example." The eudi-solana repo
already mints SD-JWT VC + KB-JWT via `signer-credo` (`@credo-ts`).

## Decision

- **Self-generate** the fixture set with eudi-solana's signer: known-good plus a
  deliberate **known-bad** matrix — tampered issuer signature, `sd_hash`
  mismatch, expired `exp`, wrong `aud`/`nonce`, and an overasking Presentation
  Request.
- **Supplement** with public IETF SD-JWT-VC spec examples for standards fidelity.
- Ship the good/representative ones as the in-app **"load example"** data.
- Generation is a scripted, reproducible step; fixtures are committed.

## Consequences

- Reuses the reference project directly (the stated goal of pointing at it).
- Negative fixtures make each verification check independently TDD-able.
- A fixtures generation script becomes a small dependency on the eudi-solana
  toolchain — keep it a separate, documented dev script, not a runtime coupling.

## Update (2026-07-09) — what shipped

The self-generated matrix shipped in full: seven eudi-solana-signed SD-JWT VC
vectors (good issuance + presentation and the five negatives — tampered issuer
sig, `sd_hash` mismatch, expired, wrong `aud`, wrong `nonce`) plus two
hand-authored OpenID4VP request vectors (`src/fixtures/vectors/`,
`src/fixtures/README.md`). The **IETF SD-JWT-VC spec examples** ("Supplement"
above) are **not yet committed** — deferred; the generated matrix already covers
every Phase 2 check. Adding the spec vectors is tracked in `plans/ROADMAP.md`.
