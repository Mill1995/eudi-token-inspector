# Deploy — eudi-inspector.yannickjourney.com

Static SPA (ADR 0003) on **Cloudflare** (Workers Static Assets), own project
(ADR 0010, 0011), served at the subdomain `eudi-inspector.yannickjourney.com`.
Registrar = Namecheap; DNS is delegated to Cloudflare (the apex
`yannickjourney.com` already runs on Cloudflare, confirming Case A).

## How deploys work (CI/CD)

The project is connected to the GitHub repo via **Cloudflare's Git
integration**. On every push Cloudflare clones the repo, runs our build, and
deploys the output — the build logic (`pnpm run build`) lives in the repo.

- **Push to `main`** → production deploy.
- **Pull request** → preview deploy at a per-branch `*.pages.dev` URL.

There is **no deploy GitHub Action** — Cloudflare owns deployment. GitHub
Actions only runs `ci.yml` (the `verify` + `build` gate) on push/PR. No
Cloudflare secrets live in GitHub.

### Project settings (Cloudflare dashboard → the project → Settings → Build)

| Setting                | Value                                                  |
| ---------------------- | ------------------------------------------------------ |
| Build command          | `pnpm run build`                                       |
| Deploy command         | `npx wrangler deploy` (or `pnpm exec wrangler deploy`) |
| Build output directory | `dist`                                                 |

Node and pnpm are auto-detected from `.node-version` and the `packageManager`
field.

### Config that makes it work

- `wrangler.jsonc` — Workers Static Assets config: serves `./dist`, with
  `not_found_handling: single-page-application` so client routes fall back to
  `index.html`.
- `wrangler` is a pinned `devDependency` and `pnpm-workspace.yaml` lists
  `onlyBuiltDependencies: [esbuild, sharp, workerd]`. pnpm 11 blocks dependency
  build scripts by default; `workerd`'s postinstall fetches the runtime binary
  and **must** be allowed or `wrangler deploy` fails with
  `ERR_PNPM_IGNORED_BUILDS`.
- `public/_headers` — CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`,
  Permissions-Policy, and long-cache for hashed assets. Vite copies it into
  `dist/`; Workers Static Assets serves it.

> The CSP in `public/_headers` has not yet been verified against the running app
> in a browser — do that on the first deploy / in the Phase 5 polish pass.

## Attach the subdomain

DNS is on Cloudflare (Case A), so this needs **no Namecheap changes**:

1. The project → **Custom domains** → **Set up a custom domain**.
2. Enter `eudi-inspector.yannickjourney.com`.
3. Cloudflare auto-creates the CNAME in the `yannickjourney.com` zone and issues
   the cert.

## Portfolio "presents" link (manual, per workspace rule)

In `yannick-presents-code`: add a project card linking to
`https://eudi-inspector.yannickjourney.com` and vendor one screenshot. No
build-time dependency between the repos.
