# ADR 0009 — Launch shape

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

The pitch cites the June hackathon's developer-tools appetite as evidence of
demand. Question was whether a hard event deadline drives the build.

## Decision

**Ship-fast MVP, no hard deadline.** Timebox ~1–2 weeks part-time. "Done enough
to publish" = the three headline features working on SD-JWT + OpenID4VP, static
deploy, "load example", README, and a Show HN / dev-community launch post. Then
iterate in public.

## Consequences

- Quality bar is "genuinely useful and correct", not "demo by date X" — matches
  the TDD workflow (correctness gated by the negative fixtures of ADR 0008).
- Scope discipline: anything not in the three headline features + polish is v2
  (mdoc, eIDAS LOTL, future extensions).
- Launch is a deliverable: the README and launch post are part of the final phase,
  not an afterthought.
