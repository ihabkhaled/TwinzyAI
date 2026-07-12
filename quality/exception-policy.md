---
id: quality-exception-policy
title: Exception Policy
type: quality
authority: canonical
status: current
owner: repository owner
summary: What may be excepted (config-level rule adjustments, recorded and expiring) and what never may (inline suppressions, hook bypasses, product invariants); the register lives in docs/exceptions/.
keywords: [exceptions, policy, eslint, suppressions, register, expiry, non-negotiable, waivers]
contextTier: 2
relatedCode: [eslint.config.mjs]
relatedTests: []
relatedDocs: [docs/exceptions/README.md, docs/exceptions/exception-template.md, quality/waiver-register.md]
readWhen: A rule or check is blocking you and you are considering an exception instead of a fix.
---

# Exception Policy

The exceptions register itself is owned by
[docs/exceptions/README.md](../docs/exceptions/README.md) (currently: EXC-0001, EXC-0002,
EXC-0003 active; EXC-0004 superseded) — file new exceptions there using
[docs/exceptions/exception-template.md](../docs/exceptions/exception-template.md). This policy
defines the boundaries.

## What an exception is

A **standing, config-level adjustment** — e.g. turning a lint rule off repo-wide with a
documented reason, alternatives considered, mitigation, detection, and a removal plan (the
template's required fields). Exceptions are dated, owned, and **expire; expired exceptions
block release** ([docs/exceptions/README.md](../docs/exceptions/README.md)).

It is not a [waiver](waiver-register.md) (a one-off decision to ship past a red gate) and not a
policy change (which edits the owning rule file per CLAUDE.md "When This File Must Be Updated").

## Never exceptable — no process exists for these

Per CLAUDE.md Non-Negotiable Gates and the register's own preamble ("never authorizes inline
eslint-disable/@ts-ignore/skipped tests/hook bypasses"):

1. Inline ESLint suppression in any form (`eslint-disable*`, `eslint-enable`) — mechanically a
   lint error itself.
2. `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck`.
3. Skipped or focused tests as a merge state.
4. Bypassing Husky hooks or CI gates (`--no-verify`) outside a written emergency exception
   recording why, who approved, what was skipped, and when it will be restored (CLAUDE.md
   local-gate rules).
5. The Twinzy product invariants: consent-first, no image persistence, extraction-only image
   boundary, no identity/sensitive inference, env-only models, free-by-default paywall lever,
   no TS `enum` (CLAUDE.md Twinzy Product Constraints).

## Granting flow

1. Try the fix first — a firing rule usually means wrong code or wrong layer (CLAUDE.md).
2. If a config-level exception is genuinely warranted, fill the template with all required
   fields, get repository-owner approval, and land the config change + register entry in the
   same PR.
3. Reference the exception ID in the PR description; reviewers verify scope is minimal.
4. Remove the exception per its removal plan; the register keeps superseded entries for history
   (EXC-0004 precedent).
