# Repo setup — branch protection & hardening

One-time GitHub configuration for `Mill1995/eudi-token-inspector`. Run these
from a shell with `gh` authenticated. Deployment is via Cloudflare's Git
integration (kept out of this repo).

## Branch protection ruleset

Protects the default branch (`main`): no direct pushes (PR required), no force
pushes, no deletion, and CI (`verify`) must pass and be up to date before merge.
Approvals are set to 0 so a solo maintainer can self-merge once checks are green.

```bash
gh api --method POST repos/Mill1995/eudi-token-inspector/rulesets \
  --input docs/github-ruleset.json
```

The required check is the `verify` job in `.github/workflows/ci.yml`; the name
must match. To allow emergency admin direct-push, add yourself as a bypass actor
in **Settings → Rules → main** (leave the JSON as-is otherwise).

Update later by editing the JSON and PUT-ing to the ruleset id:

```bash
gh api repos/Mill1995/eudi-token-inspector/rulesets            # list ids
gh api --method PUT repos/Mill1995/eudi-token-inspector/rulesets/<id> \
  --input docs/github-ruleset.json
```

## Secret-leak protection

Public repos get secret scanning free. Turn on **push protection** so commits
containing a detected secret are blocked before they reach GitHub — the
belt-and-suspenders to `.gitignore`. (Deployment uses Cloudflare's Git
integration, so there are no Cloudflare secrets in GitHub to leak.)

```bash
gh api --method PATCH repos/Mill1995/eudi-token-inspector \
  -f 'security_and_analysis[secret_scanning][status]=enabled' \
  -f 'security_and_analysis[secret_scanning_push_protection][status]=enabled'
```

## Dependency security

Dependabot version updates are configured in `.github/dependabot.yml` (weekly,
7-day cooldown, grouped). Also enable vulnerability alerts + automated security
fixes:

```bash
gh api --method PUT repos/Mill1995/eudi-token-inspector/vulnerability-alerts
gh api --method PUT repos/Mill1995/eudi-token-inspector/automated-security-fixes
```

## Repo hygiene

Delete head branches automatically after merge:

```bash
gh api --method PATCH repos/Mill1995/eudi-token-inspector -F delete_branch_on_merge=true
```

## What the CI/CD adds

- `ci.yml` — `verify` (fmt, lint, typecheck, tests) + `build`, on every push/PR.
  This is the required status check above.
- Deployment is handled by Cloudflare's Git integration, not a GitHub Action.
