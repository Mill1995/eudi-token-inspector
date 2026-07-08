# ADR 0010 — Serving on the portfolio domain

- Status: Accepted (2026-07-04) — revisit if a root-domain path is wanted
- Deciders: Yannick (default chosen without response; flag to confirm)

## Context

Goal: serve EUDI Inspector on yannickjourney.com (Portfolio: Vite+React+shadcn,
Cloudflare Pages, owner Mill1995). Three options: (A) subdomain + own repo,
(B) subpath inside the portfolio repo, (C) subpath + Cloudflare Worker to a
separate project. ADR 0007 requires the inspector to be its own public,
self-hostable Apache-2.0 repo.

## Decision

**Option A — `eudi-inspector.yannickjourney.com`.** The inspector is its own
public repo + its own Cloudflare Pages project, mapped to a subdomain. The
Portfolio **presents** it via a project card that links out — the workspace's
existing "presents, no build-time dependency" pattern (assets/copy vendored
manually into the portfolio; the tool itself runs from its own deploy).

## Consequences

- ADR 0007 stays intact — own repo, self-hostable, auditable privacy claim.
- Independent deploys/versioning; zero coupling to the portfolio build.
- Cost: served at a subdomain, not a root-domain path.
- Reversible: a later root-domain path is Option C (Worker proxy to this same
  Pages project) with no repo move.
- Portfolio task (Phase 5): add a project card linking to the subdomain +
  vendor a screenshot, per the manual-vendor rule.
