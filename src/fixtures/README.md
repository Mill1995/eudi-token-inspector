# Test vectors

The committed EUDI artifact matrix that drives the inspector's tests and the "load example" UI
(ADR [0008](../../docs/adr/0008-fixtures.md)). Each vector is a JSON file in `vectors/`; `index.ts`
loads and narrows them into typed [`Fixture`](./types.ts) objects.

Every negative vector isolates **one** failing verification check, so each Phase 2 check has a vector
that fails on it and no other — see the `expect` map (`pass` / `fail` / `skip`, ADR
[0002](../../docs/adr/0002-full-local-verification.md)).

## The matrix

| id                        | kind                   | intended result                                    |
| ------------------------- | ---------------------- | -------------------------------------------------- |
| `good-issuance`           | sd-jwt-vc-issuance     | issuer signature + temporal pass; decodes cleanly  |
| `bad-tampered-issuer-sig` | sd-jwt-vc-issuance     | issuer signature **fail** (one byte flipped)       |
| `bad-expired`             | sd-jwt-vc-issuance     | temporal **fail** (`exp` before verification time) |
| `good-presentation`       | sd-jwt-vc-presentation | every check passes                                 |
| `bad-sd-hash-mismatch`    | sd-jwt-vc-presentation | `sd_hash` **fail** (a disclosure dropped)          |
| `bad-wrong-aud`           | sd-jwt-vc-presentation | audience **fail**                                  |
| `bad-wrong-nonce`         | sd-jwt-vc-presentation | nonce **fail**                                     |
| `overasking-request-dcql` | openid4vp-request      | overasking rules fire (DCQL query)                 |
| `request-pex`             | openid4vp-request      | no overasking (Presentation Exchange baseline)     |

## Provenance

- **The seven SD-JWT VC vectors are generated**, not hand-edited. A self-issued issuer (Ed25519
  `did:key`) signs a holder-bound PID SD-JWT VC; presentations carry a real P-256 KB-JWT. The
  generator lives in the reference project:
  `eudi-solana/packages/signer-credo/scripts/gen-inspector-fixtures.ts`.
- **The two OpenID4VP request vectors are hand-authored** here (no signer needed).

The good/bad temporal boundary is pinned to `verificationTimeSeconds` (unix `1780000000`); a verifier
must use that time, not the wall clock, to reproduce the expected temporal outcomes.

Regenerating reproduces an **equivalent** matrix, not identical bytes — SD-JWT disclosure salts and
the P-256 signature are randomized per run, so the committed JSON is the canonical set. Regenerate
only when the schema or matrix changes:

```bash
# in the eudi-solana repo
pnpm --filter @eudi/signer-credo gen:inspector-fixtures
```

## Proposed overasking rule ids (Phase 3)

`overasking-request-dcql` names the rules it should fire; the Phase 3 engine
(ADR [0005](../../docs/adr/0005-overasking-heuristic-ruleset.md)) implements them:

- `exact-birthdate-when-age-assertion-suffices`
- `portrait-in-remote-flow`
- `unique-identifier-maximises-linkability`
