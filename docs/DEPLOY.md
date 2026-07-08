# Deploy — eudi-inspector.yannickjourney.com

Static SPA (ADR 0003) on **Cloudflare Pages**, own project (ADR 0010, 0011),
served at the subdomain `eudi-inspector.yannickjourney.com`. Registrar =
Namecheap; DNS almost certainly delegated to Cloudflare (the apex
`yannickjourney.com` already runs on CF Pages, which needs CF-managed DNS for
apex CNAME flattening + auto-SSL).

Cloudflare Pages allows unlimited custom subdomains per project, free, with
automatic TLS. Namecheap being the registrar does not limit this.

## Create the Pages project

1. Push `eudi-token-inspector` to GitHub (Mill1995).
2. Cloudflare dashboard → Workers & Pages → Create → Pages → connect the repo.
3. Build: framework preset **Vite**, build command `pnpm run build`, output `dist`
   (Node pinned via `.node-version`; Cloudflare reads it).

## Attach the subdomain

### Case A — nameservers on Cloudflare (expected)

1. Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter `eudi-inspector.yannickjourney.com`.
3. Cloudflare auto-creates the CNAME in the zone and issues the cert. Done —
   **no Namecheap changes**.

Verify the setup: Cloudflare dashboard shows the `yannickjourney.com` zone as
Active, or `dig NS yannickjourney.com` returns `*.ns.cloudflare.com`.

### Case B — DNS still on Namecheap

1. Namecheap → Domain List → Manage → **Advanced DNS**.
2. Add record: **CNAME**, host `eudi-inspector`, value `<project>.pages.dev`,
   TTL automatic.
3. Pages project → Custom domains → add `eudi-inspector.yannickjourney.com`;
   Cloudflare validates via the CNAME and issues the cert.

Note: apex-on-Pages generally requires Case A, so if the root site works on
Pages you are already in Case A.

## Portfolio "presents" link (manual, per workspace rule)

In `yannick-presents-code`: add a project card linking to
`https://eudi-inspector.yannickjourney.com` and vendor one screenshot. No
build-time dependency between the repos.
