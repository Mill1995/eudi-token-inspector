# Launch post — draft

Draft copy for the Show HN / dev-community launch (ADR 0009). Plain, factual; no
marketing adjectives. Edit before posting.

---

## Show HN

**Title:** Show HN: EUDI Inspector – a client-side "jwt.io" for EU Digital Identity wallets

**Body:**

I built a browser tool for inspecting EU Digital Identity Wallet presentation
artifacts — SD-JWT VCs and OpenID4VP requests. It's the equivalent of jwt.io for
the EUDI stack.

Paste an artifact and it:

- decodes it (issuer JWT, disclosures, Key-Binding JWT);
- verifies it locally over WebCrypto — issuer and holder signatures, the
  disclosure seal (`sd_hash`), the validity window, and audience/nonce binding.
  A check reads as "skip", never a silent fail, when there's no input to decide;
- checks the issuer against a small trust snapshot or keys you paste — labeled
  informational, not an authoritative trust decision;
- flags "overasking" in a request (e.g. asking for an exact birth date when an
  age-over-18 assertion would do) against an editable, advisory rule set.

Everything runs in the browser. Nothing you paste leaves it — no backend, no
telemetry, no network calls with your data. It's open source (Apache-2.0) and
self-hostable.

The interesting/hard parts: there's no single authoritative EU issuer trust list
yet, so the tool is a configurable checker rather than an oracle; and "overasking"
is inherently subjective, so it's transparent rules-as-data with a rationale per
rule, never a verdict.

Not yet supported: mdoc/mDL (CBOR/COSE) and eIDAS trusted-list XML — both on the
v2 list.

Live: https://eudi-inspector.yannickjourney.com
Code: https://github.com/Mill1995/eudi-token-inspector

Feedback welcome, especially from anyone working on EUDI pilots.

---

## Dev-community variant (dev.to / r/eidas / androiddev.social)

**Title:** A local-only inspector for EUDI Wallet tokens (SD-JWT VC + OpenID4VP)

Short intro paragraph + the same bullet list, then a note on the stack: Vite +
React + TypeScript, SD-JWT decoding and all crypto hand-rolled over WebCrypto (no
`@sd-jwt` dependency), tested against a self-generated good/bad fixture matrix.
Link to the ADRs for the design decisions.
