# EUDI Inspector

A "jwt.io for EUDI Wallet": a client-side inspector for EU Digital Identity
presentation artifacts. Paste an **SD-JWT VC** or an **OpenID4VP** presentation
request to decode disclosures, verify signatures locally, check the issuer
against a configurable trust list, and flag overasking.

**Everything runs in your browser. Nothing you paste ever leaves it** — no
backend, no telemetry, no network calls with your data.

> Status: **Phase 0 (scaffold).** The inspector itself is under construction.
> See [`plans/ROADMAP.md`](plans/ROADMAP.md) for the plan and
> [`docs/adr/`](docs/adr/) for the decisions behind it.

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

Vite + React + TypeScript + Tailwind + [shadcn/ui](https://ui.shadcn.com), with
`@sd-jwt/sd-jwt-vc` and the WebCrypto API for verification. Quality gates:
oxlint, oxfmt, `tsc` (strict), vitest. See
[ADR 0006](docs/adr/0006-stack.md).

## Scope

**v1:** SD-JWT VC (+ Key-Binding JWT) and OpenID4VP presentation requests.
**v2 (deferred):** mdoc/mDL, eIDAS trusted-list XML parsing. See the ADRs.

The trust check is **informational, not authoritative** — it never issues a
verdict on an issuer's legal standing.

## License

[Apache-2.0](LICENSE). See [NOTICE](NOTICE).
