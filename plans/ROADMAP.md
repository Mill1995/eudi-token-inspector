# EUDI Inspector — execution roadmap

A "jwt.io for EUDI Wallet": a client-side inspector for SD-JWT VC + OpenID4VP
Presentation Requests. Decode disclosures, verify locally, check against a
configurable trust list, flag overasking. Free, open-source (Apache-2.0),
zero-backend static SPA.

Decisions are canonical in `docs/adr/`. Domain terms in `UBIQUITOUS_LANGUAGE.md`.
Working name **EUDI Inspector**; repo `eudi-token-inspector`; owner `Mill1995`.

## Locked decisions (see ADRs)

| #    | Decision                                                                                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 0001 | v1 = SD-JWT VC (+KB-JWT) + OpenID4VP request. mdoc → v2.                                                                                    |
| 0002 | Full local verification: sig, KB sig, sd_hash, temporal, nonce/aud, trust. pass/fail/**skip**.                                              |
| 0003 | Zero backend. Key resolution: x5c → fetch → **paste fallback**. Bundled trust snapshot. Tokens never leave the browser.                     |
| 0004 | Trust = configurable anchors + curated pilot/test snapshot, **informational** only.                                                         |
| 0005 | Overasking = transparent, editable heuristic ruleset (rules-as-JSON), advisory.                                                             |
| 0006 | Vite + React + TS + Tailwind + shadcn/ui. `@sd-jwt/sd-jwt-vc` + WebCrypto. oxlint/oxfmt/tsc-strict/vitest.                                  |
| 0007 | One public repo, Apache-2.0, self-hostable, **no paid scaffolding in v1**.                                                                  |
| 0008 | Fixtures self-generated via eudi-solana `signer-credo` + IETF spec vectors; known-good + known-bad matrix.                                  |
| 0009 | Ship-fast MVP, ~1–2 weeks part-time, Show HN / dev-community launch, no hard deadline.                                                      |
| 0010 | Serve at **`eudi-inspector.yannickjourney.com`** (own repo + Cloudflare Pages); Portfolio presents it via a linking card. Revisitable.      |
| 0011 | **Standalone repo**, not in the eudi-solana monorepo. Fixtures generated in eudi-solana, JSON vectors committed here. See `docs/DEPLOY.md`. |

## Non-goals (v1)

mdoc/mDL · eIDAS LOTL XML parsing · any backend/proxy · paid/team features ·
persisting or transmitting pasted artifacts · being an authoritative trust oracle.

## Architecture shape

- **`domain/`** — pure, format-agnostic: an `Artifact` union (`Credential` |
  `KbJwt` | `PresentationRequest`), decoders, and a `Check` result type
  (`pass | fail | skip` + reason). No React, no DOM. Fully unit-tested.
- **`verify/`** — WebCrypto signature checks, `sd_hash` recomputation, temporal,
  binding. Key resolution ports (x5c / fetch / pasted).
- **`overasking/`** — rules-as-data engine over a `PresentationRequest`.
- **`trust/`** — anchor store + curated snapshot + membership check.
- **`ui/`** — shadcn components; a three-pane inspector (input · decoded · checks).
- Keeping domain format-agnostic is what lets v2 add mdoc without churning UI.

## Phases (TDD: each task names a verifying test; done = test green + `pnpm verify` clean)

### Phase 0 — Scaffold & gates

- Vite+React+TS+Tailwind+shadcn init; strict tsconfig; oxlint/oxfmt/vitest; prek hooks; CI; Apache-2.0 LICENSE; README skeleton; static deploy target (Cloudflare Pages / Vercel).
- **DoD:** empty app deploys to a public URL; `pnpm verify` green in CI.

### Phase 1 — Decode / Inspect (tracer bullet)

- Fixtures script: generate good SD-JWT VC + KB-JWT via eudi-solana signer; commit vectors + IETF examples.
- `domain/`: artifact detection + SD-JWT/KB-JWT/disclosure decoders. _Test:_ decode a fixture → exact claims + all disclosures.
- Three-pane inspector UI; "load example" button.
- **DoD:** paste a real SD-JWT VC → see header, payload, every disclosure resolved; example loads.

### Phase 2 — Verify

- Issuer signature (WebCrypto ES256/EdDSA/ES384); key resolution x5c → fetch → paste. _Tests:_ good passes; tampered fails; no-key → **skip**.
- KB-JWT signature; `sd_hash` recompute vs presented disclosures; temporal (`exp`/`iat`/`nbf`). _Tests:_ one negative fixture per check fails on the right check.
- pass/fail/skip badges with reasons in the checks pane.
- **DoD:** known-good all-pass; each negative fixture fails exactly its intended check; missing key reads as skip, never fail.

### Phase 3 — Presentation Request + Overasking

- Parse OID4VP request: `presentation_definition` (PEX) and `dcql_query` (DCQL). _Test:_ both shapes → normalized requested-claims list.
- Pair a request with a credential: check `nonce`/`aud` + claim coverage.
- Overasking engine (rules-as-JSON) with the ADR-0005 seed rules. _Test:_ overasking fixture fires expected rule ids with severity + rationale.
- **DoD:** paste a request → requested claims rendered; overasking fixture flags the expected rules; rules file is visible/editable.

### Phase 4 — Trust list

- Trust-anchor import panel (paste JWKS / cert / eIDAS trusted-list URL); curated snapshot data file (sourced, reviewed).
- Issuer membership check, labeled **informational**. _Tests:_ issuer in snapshot → informational pass; unknown → not-trusted with a paste-anchor path.
- **DoD:** trust result shows for a fixture issuer; unknown issuer offers the anchor-import flow; label makes non-authority explicit.

### Phase 5 — Polish & launch

- Empty-state onboarding; good + bad examples; copy/share of a decoded view; responsive; a11y pass; error states for garbage input.
- README (what it is, privacy claim, self-host), `docs/` for the trust/overasking data, screenshots.
- Deploy to `eudi-inspector.yannickjourney.com` (own Cloudflare Pages project, ADR 0010); add a Portfolio project card linking out + vendor a screenshot (manual-vendor rule).
- Draft Show HN / dev-community post.
- **DoD:** public URL live; README + launch post ready; portfolio links it.

## Key risks & mitigations

| Risk                                             | Mitigation                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------- |
| `@sd-jwt` browser/alg coverage gaps              | Spike in Phase 1; fall back to raw WebCrypto for sig verify.                      |
| CORS on key/trust fetch                          | Paste fallback is the designed path (ADR 0003), not an error.                     |
| DCQL vs presentation_definition both in the wild | Support both from Phase 3; normalize to one internal claims model.                |
| Overasking subjectivity / liability              | Advisory framing + editable rules + rationale text; never a verdict.              |
| Trust snapshot staleness                         | Build-time refresh + "informational" label everywhere.                            |
| Fixture generation couples to eudi-solana        | Keep it a documented offline dev script; committed vectors are the runtime input. |

## v2 backlog (explicitly deferred)

mdoc/mDL (CBOR/COSE) · eIDAS LOTL parsing · optional serverless proxy for public
metadata · paid team features (CI trust-list checks, audit export, CI rule packs).
