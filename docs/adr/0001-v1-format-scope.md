# ADR 0001 — v1 format scope

- Status: Accepted (2026-07-04)
- Deciders: Yannick

## Context

The product is a "jwt.io for EUDI Wallet" — a client-side inspector for EUDI
presentation artifacts. The three candidate formats are SD-JWT VC (JSON/JWT),
OpenID4VP Authorization Requests (JSON), and ISO 18013-5 mdoc/mDL (CBOR +
COSE_Sign1). mdoc requires CBOR + COSE tooling and roughly doubles the build.
The headline features are: decode disclosures, verify, check trust list, flag
overasking. Overasking analysis lives in the OpenID4VP request, not the credential.

## Decision

v1 supports **SD-JWT VC (+ KB-JWT)** and **OpenID4VP Authorization Requests**.
**mdoc/mDL is deferred to v2.**

## Consequences

- Fastest path to a shippable, slick single-purpose tool.
- Overasking analysis is possible in v1 (it reads the OID4VP request).
- Dependency set stays in the JSON/JWT world — no CBOR/COSE in v1.
- v2 adds mdoc; the UI and domain model must not hard-assume JWT-shaped input.
