# ADR 0002 — Full local verification

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

An inspector that only decodes is "just a base64 pretty-printer." The moat over
a plain decoder — and the thing that makes it useful to EUDI developers — is
telling them _why_ a presentation would be accepted or rejected.

## Decision

v1 performs the full set of local checks, each surfaced as an explicit
**pass / fail / skip** badge (skip = not enough input to decide, e.g. no key):

1. SD-JWT **issuer signature** (P-256/ES256 etc.).
2. **KB-JWT holder signature**.
3. **`sd_hash`** in the KB-JWT matches the exact set of presented Disclosures.
4. **Temporal**: `exp` / `iat` / `nbf` of both JWTs.
5. **Binding context**: KB-JWT `nonce` and `aud` (checked against the paired
   Presentation Request when both are provided).
6. **Trust List** membership of the Issuer (see ADR 0003).

## Consequences

- Needs a browser crypto/JWT stack (WebCrypto + an SD-JWT library).
- "skip" is a first-class result — the UI must distinguish "failed" from
  "couldn't check" so a missing key never reads as a forged signature.
- Each check is independently testable → strong fit for the TDD workflow.
