# 20 — Repositories & Database

> **Twinzy has no database — by standing decision, not omission.** The product is stateless: no images, no results, no user rows are persisted anywhere, ever. This file exists so that *if* persistence is ever introduced (for future non-sensitive data only, behind an ADR), it lands correct on day one — and because its bounds already apply to in-memory stores today. Implements rules 20 and 31 of [00-non-negotiable-rules.md](./00-non-negotiable-rules.md).

**Standing prohibitions that no future decision can relax:** never persist images, biometric-adjacent data, extracted traits tied to a person, or anything that could re-identify a player. See [/memory/privacy-decisions.md](../memory/privacy-decisions.md).

---

## 1. What applies today (no DB)

- Any **in-memory store** (cache map, dedupe set, rate-limit bucket) obeys the same discipline: bounded (hard cap 100 entries per listable collection, explicit eviction), typed, owned by one provider, and released on shutdown ([08-reliability-durability.md](./08-reliability-durability.md)).
- No module may quietly add persistence (a file write, an embedded store, an external KV) — that is a new integration: ADR + adapter + boundaries entry + docs, or it doesn't ship ([10-library-modularization.md](./10-library-modularization.md)).

## 2. If persistence is introduced: the repository contract

A repository does **one** thing: parameterized, bounded data access at `infrastructure/<feature>.repository.ts` (`architecture/repository-persistence-only`). Zero business logic, zero authorization, zero transformation, zero error vocabulary.

| Allowed | Banned — push up to service / domain / lib |
| --- | --- |
| find / save / update / delete / count, typed query building | Business decisions, status rules, scoring → `domain/` |
| Conditional query building (add a filter only when present) | Throwing `AppError`/`messageKey` → the service decides |
| Pagination math + stable ordering | DTO mapping / response shaping → `lib/` mappers |
| `logger.debug` tracing via `AppLogger` | `console.*`; importing controllers/services/use-cases/DTOs |

> Repositories return data or `null`. A not-found is `null`, an empty list is `[]` — the **service** translates that into a `messageKey`. The ORM/driver client is imported only inside `infrastructure/` (or an adapter); business code depends on the repository's typed signatures, never the engine.

## 3. Injection safety (bind values, allowlist identifiers)

**User input enters a query only as a bound parameter — never as query text, never as an identifier.**

- **Values** bind as parameters / the client's structured `where`. String concatenation or template literals carrying input into query text are forbidden, including in any "raw" escape hatch (placeholders + argument array only).
- **Identifiers** (column, table, sort key, direction) are never parameterizable — validate them against a static allowlist constant in `model/<feature>.constants.ts` before they touch the query; direction is an as-const member validated in the DTO.
- **Filters are explicit, never reflective.** Each filterable column is a deliberate, named, parameterized branch — no "apply whatever the client sends" loop (that reopens injection *and* mass assignment).
- **Escape `LIKE`/`ILIKE` wildcards** (`%`, `_`, `\`) in one shared helper before binding search strings.
- **Document stores:** validate to primitives/enums at the DTO so operator-shaped input (`$ne`, `$gt`, `$where`) can never smuggle through.
- **No string-built queries, no dynamic DDL, no destructive auto-sync** — schema changes are static, reviewed migrations with a real `down()`.

```ts
// Don't — interpolation (injection) + client-supplied identifier
qb.where(`t.label = '${input.label}'`).orderBy(query.sortBy);

// Do — bound value + allowlisted identifier
qb.where('t.label = :label', { label: input.label });
applySorting(qb, 't', query.sortBy, query.order, THEME_SORT_FIELDS, 'createdAt');
```

## 4. Bounded lists (cap 100)

No list method returns an unbounded result set. Every list takes `page`/`limit`, clamps `limit` to the shared hard max (**100** — a named constant, enforced in the DTO **and** defensively re-clamped in the repository), requires a stable `ORDER BY`, and returns `{ items, total }`. Index every new `WHERE`/`ORDER BY`/FK column in the same change.

## 5. Safe error surfacing

Driver errors leak schema and SQL. The repository lets them bubble raw to its caller; the **service** maps known failures (unique violation → `ConflictError`) to typed `AppError`s with distinct `messageKey`s; the global filter sanitizes ([26-error-handling-and-exceptions.md](./26-error-handling-and-exceptions.md)). Raw driver text never reaches a client.

## 6. Prove it with tests

Any future search/filter/sort/write surface ships tests that prove the hole is closed: malicious sort falls back to the default (200, schema intact); `' OR '1'='1` is treated as a literal; `limit=99999/-1/abc` clamps into `[1, 100]`; operator-shaped params are rejected at the DTO ([09-testing-coverage.md](./09-testing-coverage.md)).

---

## Checklist

- [ ] No persistence added without ADR + adapter + boundaries entry + docs
- [ ] Never images, biometrics, traits, or re-identifying data — under any future decision
- [ ] In-memory stores bounded, typed, evicting, released on shutdown
- [ ] (Future) repository persists only; returns entity/`{items,total}`/`null`; no domain errors
- [ ] (Future) every value bound; every identifier allowlisted; filters explicit; lists capped at 100
- [ ] (Future) migrations static + reviewed with real `down()`; injection tests written first
