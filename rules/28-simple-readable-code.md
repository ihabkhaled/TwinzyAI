# 28 — Simple Readable Code

> The best TwinzyAI code is the code the next developer understands immediately. Code is written once and read hundreds of times — by juniors, seniors, QA, security/privacy reviewers, and AI coding agents. Optimize for the reader under pressure, not for the author's cleverness.

Related: [29-reuse-before-creating.md](./29-reuse-before-creating.md) · [30-refactor-discipline.md](./30-refactor-discipline.md) · [05-types-enums-constants.md](./05-types-enums-constants.md) · [19-services-application-layer.md](./19-services-application-layer.md) · [23-review-checklist.md](./23-review-checklist.md)

---

## 1. The Simple Code Ladder (run before writing any code)

```txt
1. Does this code need to exist?            → if no, do not write it.
2. Does TwinzyAI already have this?         → reuse or extend the existing owner.
3. Does the platform already solve it?      → stdlib / Node / browser / Next / Nest / React first.
4. Does an approved wrapper already own it? → use the existing adapter/gateway/service/hook/util.
5. Can it be a small pure helper?           → put it in the correct lib/ / model/ / shared owner.
6. Can it be written directly and clearly?  → write the direct readable version.
7. Only then create a new abstraction       → and only with a REAL current reason: repeated use,
   layer boundary, provider adapter, security isolation, gateway boundary, testability, safety.
```

The ladder runs **after** reading the real code, and it never skips: tests, docs, validation, security, privacy, AI safety, accessibility, i18n, or architecture. Be lazy about code volume — never about reading, validating, or gating.

## 2. What simple means here

Simple code is: easy, boring, obvious, short without being cryptic, strict without being complicated, helper-driven where it prevents repeated changes, and readable by humans before being impressive to machines.

Banned styles (reviewers block these):

- clever one-liners and dense chained transformations that need mental unrolling
- nested ternaries (lint-enforced) and hidden control flow
- speculative abstractions: factories/strategies/base-classes/generic types with one consumer and no concrete second use
- "smart TypeScript": conditional-type gymnastics, mapped-type tricks, or inference puzzles where a plain type works
- god files: huge services, hooks, components, containers, gateways, adapters (size caps in rules 02/03/19 are mechanical)
- duplicate constants/validators/mappers/helpers (one owner per concern — rule 29)
- dead code, unused config, unused env vars, commented-out blocks
- token-burning code: verbose boilerplate, redundant comments restating the code, and copy-paste blocks — they waste every future reader's (and agent's) context budget

## 3. What simple never removes

Simplicity means **minimum safe code**, not minimum code. Never simplified away: extraction-only image use + wipe-in-finally, text-only downstream AI, consent-first upload validation, Zod validation, AI safety filters + forbidden-wording guards, error handling, typed config, log redaction, rate limits, tests, observability, accessibility, i18n/RTL, strict TS/ESLint, architecture boundaries, release gates.

## 4. Review lens

Reviewers judge every diff with: "Would a new mid-level hire understand this file in one read?" If the answer needs a walkthrough, the code — not the reader — is wrong. Point violations at this rule by number.
