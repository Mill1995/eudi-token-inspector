# ADR 0003 — Zero-backend key & trust resolution

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

Verification (ADR 0002) needs issuer public keys and a trust list. In a
browser-only app, fetching issuer JWKS / DID docs / trust lists routinely hits
CORS. The product's core risk story is "pure client-side — nothing leaves the
browser." A proxy would fix CORS but adds infra and a caveat to that story.

## Decision

**No backend in v1.** Resolution order for issuer keys:

1. `x5c` in the JWT header — no fetch needed (best case).
2. Direct in-browser fetch of SD-JWT VC issuer metadata / JWKS / DID document.
3. On CORS failure or absent metadata — **prompt the user to paste** the
   JWKS/key or upload the issuer metadata JSON.

**Trust list** ships as a **bundled snapshot** committed to the repo and
refreshed at build time; the app may also attempt a direct fetch for freshness.

The pasted artifact (Credential / KB-JWT / Presentation Request) **never leaves
the browser** under any path.

## Consequences

- Deploy is static hosting — zero infra, zero running cost, matches "lowest-risk."
- The privacy claim is literally true and easy to verify (no network egress of
  user input).
- Cost: occasional manual paste when CORS blocks a fetch; a trust snapshot that
  can go stale between builds (documented; a build job keeps it fresh).
- A proxy for public metadata is a possible later add-on but is explicitly out
  of v1 — see the paid "team features" line (CI trust-list checks) as its home.
