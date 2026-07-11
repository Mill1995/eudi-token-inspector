# Ubiquitous Language

Glossary for the EUDI token inspector. Built incrementally during the grilling
session; terms are added as decisions land.

## Artifacts (what a user pastes in)

| Term                     | Definition                                                                                                                         | Aliases to avoid          |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| **Credential**           | An SD-JWT VC: an issuer-signed JWT carrying selectively-disclosable claims.                                                        | VC, token, JWT            |
| **Disclosure**           | A salted `[salt, claim_name, value]` triple that reveals one hidden claim.                                                         | claim blob                |
| **`_sd` digest**         | A SHA-256 hash of a Disclosure, embedded in the issuer-signed payload; a Disclosure is bound to the Issuer iff its digest is here. | hash, sd                  |
| **KB-JWT**               | Key-Binding JWT: a holder-signed JWT proving possession of the credential's bound key, carrying `sd_hash`, `nonce`, `aud`.         | binding token, holder JWT |
| **Presentation Request** | An OpenID4VP Authorization Request stating which claims a verifier wants.                                                          | auth request, ask         |
| **Query**                | The claim-selection body of a Presentation Request: `presentation_definition` (older) or DCQL (`dcql_query`, newer).               | pex, definition           |
| **Query Language**       | Which shape a Query is in — `dcql` or `presentation-exchange`. The inspector normalizes both to one model.                         | format                    |
| **Requested Claim**      | One claim a verifier asks for, normalized across Query languages to a `path` (plus an optional pinned value).                      | field, constraint         |

## Actors

| Term          | Definition                                                                     | Aliases to avoid          |
| ------------- | ------------------------------------------------------------------------------ | ------------------------- |
| **Issuer**    | Party that signs a Credential.                                                 | authority                 |
| **Holder**    | Wallet/user presenting a Credential; signs the KB-JWT.                         | subject, user, wallet     |
| **Verifier**  | Relying party that sends a Presentation Request and consumes the presentation. | RP, relying party, reader |
| **Developer** | The inspector's actual user: someone debugging any of the above.               | —                         |

## Inspector concepts

| Term                 | Definition                                                                                  | Aliases to avoid                |
| -------------------- | ------------------------------------------------------------------------------------------- | ------------------------------- |
| **Inspect**          | Decode + structurally explain an artifact (always local, no network).                       | parse, view                     |
| **Verify**           | Cryptographically/logically check an artifact (signatures, `sd_hash`, expiry, binding).     | validate                        |
| **Trust List check** | Compare an Issuer against a known set of trusted issuers/anchors.                           | trust check                     |
| **Overasking**       | A Presentation Request demanding claims beyond a defensible minimum for its stated purpose. | over-collection, greedy request |

## Trust & minimisation

| Term                   | Definition                                                                                                 | Aliases to avoid   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------ |
| **Trust Anchor**       | A public key / cert / issuer identifier the user declares trustworthy, against which an Issuer is checked. | root, CA           |
| **Curated Snapshot**   | The bundled, reviewed set of well-known pilot/test issuers shipped with the app.                           | default list       |
| **PID**                | Person Identification Data: the core EUDI identity credential.                                             | ID credential      |
| **`purpose`**          | The verifier-stated reason for a requested claim, carried in the Query.                                    | reason             |
| **Overasking Rule**    | One editable heuristic that fires on a data-minimisation smell, with severity + rationale.                 | check, lint        |
| **Overasking Finding** | An Overasking Rule that fired against a request, carrying the Requested Claims that tripped it. Advisory.  | violation, verdict |
| **Result badge**       | An artifact check outcome: **pass** / **fail** / **skip** (skip = not enough input to decide).             | status, error      |

## Relationships

- An **Issuer** signs a **Credential**; a **Holder** signs a **KB-JWT** over that Credential.
- A **Credential** contains one or more **Disclosures**; each is bound to the **Issuer** by its **`_sd` digest**, and the **KB-JWT**'s `sd_hash` binds the exact set presented.
- A **Verifier** sends a **Presentation Request** whose **Query** the inspector reads to flag **Overasking**.

## Example dialogue

> **Dev:** "I pasted a **Credential** and it says the issuer signature is **skip**, not fail — why?"
> **Domain expert:** "Skip means we couldn't resolve the **Issuer**'s key. The inspector makes no network calls, so it doesn't fetch keys — paste the issuer JWKS/JWK (or a **Trust Anchor**) and it'll flip to pass or fail."
> **Dev:** "Once I do, does that also tell me if the issuer is trusted?"
> **Domain expert:** "Different check. Signature says the **Credential** is authentic; the **Trust List check** says the **Issuer** is in your anchors or the **Curated Snapshot**. Both can be pass while trust is still just _informational_."
> **Dev:** "And the **Overasking** flags — those are on the **Credential**?"
> **Domain expert:** "No — on the **Presentation Request**. We read its **Query** and fire **Overasking Rules**: e.g. it asked for exact `birth_date` when `age_over_18` was available. Advisory, not a verdict."

## Flagged ambiguities

- "token" is overloaded (credential vs KB-JWT vs OID4VP request). Prefer **Credential**, **KB-JWT**, **Presentation Request** — reserve "artifact" as the umbrella term for any pasted input.
- "verify" vs "inspect": **Inspect** never touches the network and never judges validity; **Verify** does. Keep them distinct in UI and code.
