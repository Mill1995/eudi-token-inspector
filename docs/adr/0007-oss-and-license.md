# ADR 0007 — Open source, license, and the free/paid boundary

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

Strategy (from the pitch) is: give the inspector away free, monetise later via
team features (CI-integrated trust-list checks, audit export). The global
philosophy forbids premature abstraction and speculative features.

## Decision

- **One public repo** = the entire free inspector.
- **License: Apache-2.0** (matches eudi-solana).
- **Self-hostable** — no hidden backend (consistent with ADR 0003).
- **Paid team features are NOT built or scaffolded in v1.** If demand appears,
  they get a separate repo/service. No `/pro` folder, no feature flags, no
  monetization plumbing now.

## Consequences

- Full auditability makes the "nothing leaves the browser" claim checkable —
  reinforces the core trust proposition.
- Maximises dev-tool / hackathon community goodwill (Postman-style coexistence).
- When paid features come, the split is a clean new boundary, not a retrofit.
