# ADR 0011 — Standalone repo, not in the eudi-solana monorepo

- Status: Accepted (2026-07-07) — default chosen without response; flag to confirm
- Deciders: Yannick

## Context

Question: scaffold the inspector inside the eudi-solana pnpm+cargo monorepo
(reuse CI/tooling, maybe `proof-core`) or as its own repo? eudi-solana is a
specific Solana-binding PoC (Rust/Anchor + TS), Apache-2.0, owner Mill1995.

Investigated reuse: `proof-core` is pure TS but binding-specific (Solana proof
commitment), not SD-JWT decoding. `signer-credo` / `verifier-client` are
node-only (`@credo-ts`, native askar) — not browser-usable. The only genuine
overlap is **fixture generation** (ADR 0008), which is a node-side dev step.

## Decision

**Standalone repo** `eudi-token-inspector` under Mill1995, Apache-2.0. Reasons:

- Matches ADR 0007 (own public, self-hostable repo) and ADR 0010, and the
  workspace rule "each product is its own git repo."
- A browser React tool does not belong inside a Rust/Anchor+Solana PoC; that
  would drag a CF/React build under a heavy toolchain and blur the PoC's scope.
- Reuse is loose and node-only: generate fixtures **in** eudi-solana, then
  **commit the resulting JSON vectors into this repo** — committed vectors are
  the runtime input (ADR 0008). No workspace/build coupling.

## Consequences

- Clean clone-and-run and self-host; independent CI/versioning/deploy (ADR 0010).
- The fixtures dev script depends on eudi-solana at generation time only; document
  it as an offline step, not a dependency.
- If real browser-usable SD-JWT logic is ever extracted, publish it as its own
  small package rather than merging the two repos.
