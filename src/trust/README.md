# Issuer trust

A **configurable trust checker, not a trust authority** (ADR
[0004](../../docs/adr/0004-trust-list-source.md)). The inspector compares a credential's issuer
against **trust anchors** and labels every result **informational — not an authoritative trust
decision**. Trust is separate from signature validity: a signature says the credential is authentic;
trust says the issuer is one you (or the snapshot) recognise.

## How a match is decided

`checkIssuerTrust` matches, in order:

1. **Issuer identifier** — the credential's `iss` equals an anchor's `issuer` (e.g. a `did:key`).
2. **Key thumbprint** — when the issuer's signing key is resolved (pasted for signature
   verification), its RFC 7638 thumbprint equals an anchor's key thumbprint. This is how a pasted
   JWKS trusts an issuer that carries no stable identifier.

No match → **unknown**, with a paste-an-anchor path (ADR 0003 — the paste fallback is the designed
path, not an error).

## Anchor sources

- **Curated snapshot** (`snapshot.json`) — a small bundled set of known issuers. It is seeded with
  the inspector's own reference issuer (the self-issued `did:key` used by the committed fixtures).
  **Extend it only with sourced, reviewed pilot anchors** (EU reference implementation, walt.id demo,
  LSP pilots) — never add an unverified key. eIDAS LOTL parsing is deferred to v2 (ADR 0004).
- **Pasted anchors** — a JWKS or JWK the user pastes in-session, matched by thumbprint.

Everything runs client-side; a pasted key never leaves the browser.
