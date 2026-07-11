# EUDI Inspector

A "jwt.io for EUDI Wallet": a client-side inspector for EU Digital Identity
presentation artifacts. Paste an **SD-JWT VC** or an **OpenID4VP** presentation
request to decode disclosures, verify signatures locally, check the issuer
against a configurable trust list, and flag overasking.

**Everything runs in your browser. Nothing you paste ever leaves it** — no
backend, no telemetry, no network calls with your data.

Live at **[eudi-inspector.yannickjourney.com](https://eudi-inspector.yannickjourney.com)**.

## What it does

- **Decode** an SD-JWT VC (issuer JWT · disclosures · Key-Binding JWT) or an
  OpenID4VP request, split into its parts — and see the **resolved claim set**
  with every disclosure woven back into the payload.
- **Verify** locally over WebCrypto: issuer + holder signatures, the
  **disclosure↔issuer binding** (each disclosure's digest is in the issuer-signed
  `_sd`, so an injected claim is caught), the disclosure seal (`sd_hash`), the
  validity window, and audience/nonce binding. A check is **skip**, never a silent
  fail, when it has no input to decide.
- **Trust** — compare the issuer against a bundled snapshot or pasted anchors;
  the result is **informational, not authoritative**.
- **Overasking** — flag data-minimisation smells in a request against an
  editable, advisory rule set (never a verdict).

See [`docs/adr/`](docs/adr/) for the architecture decisions behind it.

## Development

Requires Node 22+ and [pnpm](https://pnpm.io).

```bash
pnpm install          # install pinned dependencies
pnpm dev              # start the dev server
pnpm verify           # format check + lint + typecheck + tests (the gate)
pnpm build            # production build to dist/
pnpm test             # run unit tests once (pnpm test:watch to watch)
```

`pnpm verify` is the gate that must be green before every commit; it also runs in
CI. Git hooks are managed with [prek](https://github.com/j178/prek) — run
`prek install` once to enable them.

## Stack

Vite + React + TypeScript + Tailwind + [shadcn/ui](https://ui.shadcn.com). SD-JWT
VC decoding and all signature/thumbprint work are hand-rolled over the **WebCrypto
API** — no `@sd-jwt` dependency (see [ADR 0006](docs/adr/0006-stack.md)). Quality
gates: oxlint, oxfmt, `tsc` (strict), vitest.

## Scope

**v1:** SD-JWT VC (+ Key-Binding JWT) and OpenID4VP presentation requests. A
request can be pasted as decoded JSON, as a signed request object (JAR) JWT, or
as `{ "request": "<jwt>" }`; a `request_uri` reference can't be followed because
the tool makes no network calls — fetch it and paste the result.

**v2 (deferred):** **mdoc/mDL (ISO 18013-5, CBOR/COSE)** — the EUDI PID also ships
in this format, so this is the largest gap; and eIDAS trusted-list XML parsing.
See the ADRs.

Key resolution is the **paste path** only (paste the issuer JWK/JWKS); `x5c` and
metadata fetch are not implemented. The trust check is **informational, not
authoritative** — it never issues a verdict on an issuer's legal standing.

## License

[Apache-2.0](LICENSE). See [NOTICE](NOTICE).
