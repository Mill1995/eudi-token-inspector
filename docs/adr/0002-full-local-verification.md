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

## Update (2026-07-09) — what shipped

- A seventh check, **disclosure↔issuer binding** (`src/verify/disclosureIntegrity.ts`,
  `src/domain/disclosures.ts`), was added beyond the original six. It recomputes
  each presented disclosure's SHA-256 digest and confirms an issuer-signed `_sd`
  entry (or array `...` placeholder) references it — recursing into nested
  selective disclosure. The issuer signature covers only the issuer JWT, not the
  disclosures appended after it, so without this a disclosure injected after
  issuance would pass unnoticed. The same resolver reconstructs the plaintext
  claim set shown in the decode pane.
- The temporal check (`src/verify/temporal.ts`) verifies **`exp` and `nbf`** on
  both JWTs, not `iat`. `iat` is an issuance timestamp, not a validity boundary,
  so treating it as one would fail-close on legitimately fresh tokens; item 4
  above is narrowed to `exp` / `nbf`.
- Per the ADR 0006 Update, no SD-JWT library is used — decode, KB-JWT, and
  `sd_hash` are hand-rolled over WebCrypto; item under Consequences ("needs …
  an SD-JWT library") is superseded.
