# Launch post — draft

Draft copy for the Show HN / dev-community launch (ADR 0009). Plain, factual; no
marketing adjectives. Edit before posting.

---

## Show HN

**Title:** Show HN: A local EUDI inspector that verifies SD-JWT VCs and flags over-asking

**Body:**

There are already good SD-JWT decoders (sdjwt.co, Paradym's debugger). I wanted
one that goes past decoding to answer two questions a verifier actually has:
**would this presentation verify, and is the request asking for more than it
needs?** Everything runs client-side.

Paste an SD-JWT VC or an OpenID4VP request. It:

- **decodes** it and reconstructs the resolved claim set — every disclosure woven
  back into the issuer payload, `_sd` machinery stripped;
- **verifies** it locally over WebCrypto: issuer and holder signatures; the
  **disclosure↔issuer binding** (each disclosure's digest must appear in the
  issuer-signed `_sd`, so a claim injected after issuance is caught — the issuer
  signature alone doesn't cover the disclosures); the disclosure seal (`sd_hash`);
  the validity window; and audience/nonce binding. Each check is pass / fail /
  **skip** — skip, never a silent fail, when there's no input to decide;
- **flags over-asking** in a request (e.g. asking for an exact birth date when an
  age-over-18 assertion would do, a portrait in a remote flow, or the whole
  credential instead of named claims) against an editable, advisory rule set with
  a rationale per rule — never a verdict;
- **checks the issuer** against a small trust snapshot or anchors you paste,
  labeled informational, not an authoritative trust decision.

Everything runs in the browser. Nothing you paste leaves it — no backend, no
telemetry, no network calls with your data (CSP `connect-src 'self'` enforces it).
Open source (Apache-2.0) and self-hostable.

Some details for people in this space:

- The verification is tested against a good/bad fixture matrix, including an
  **independent ES256 vector minted by a different signer** and a negative vector
  that appends a disclosure the issuer never signed (issuer signature still
  verifies; the disclosure-binding check fails). ES256/ES384/EdDSA are supported.
- OpenID4VP requests are accepted as decoded JSON, a signed request object (JAR)
  JWT, or `{"request": "<jwt>"}`. A `request_uri` reference isn't fetched — the
  tool makes no network calls; paste the fetched request.
- "Over-asking" is inherently subjective, so it's transparent rules-as-data with a
  rationale per rule, not a judgment.

**Not supported yet:** mdoc/mDL (ISO 18013-5, CBOR/COSE) — the EUDI PID also ships
in that format, so it's the biggest gap and it's next; and eIDAS trusted-list XML.
Key resolution is paste-only (no `x5c`/metadata fetch).

Live: https://eudi-inspector.yannickjourney.com
Code: https://github.com/Mill1995/eudi-token-inspector

Feedback welcome, especially from anyone building the verifier/relying-party side
of an EUDI pilot.

---

## Dev-community variant (dev.to / r/eidas / androiddev.social)

**Title:** A local-only inspector for EUDI Wallet tokens (SD-JWT VC + OpenID4VP)

Short intro + the same bullet list, then a note on the build: Vite + React +
TypeScript; SD-JWT decoding, disclosure↔`_sd` binding, and all signature/thumbprint
work hand-rolled over WebCrypto (no `@sd-jwt` dependency); tested against a
self-generated good/bad fixture matrix plus an independent ES256 vector. Link to
the ADRs for the design decisions.
