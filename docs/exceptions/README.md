# Exceptions Register

This directory is the **only** sanctioned path around a gate for the `apps/web` frontend. If code
needs an `eslint-disable`, a `@ts-expect-error`, a suppressed rule in an
`apps/web/eslint/*.config.mjs` file, an accepted vulnerability, or a waiver of any policy in
[docs/sdlc](../sdlc/README.md) — an exception document MUST exist here first. An undocumented
suppression is a merge blocker, full stop.

> Scope: this register governs the `apps/web` frontend architecture plugin and its gates. Backend
> (`apps/api`) relaxations are documented separately in
> [docs/eslint-architecture.md](../eslint-architecture.md). The overriding governance is the root
> [CLAUDE.md](../../CLAUDE.md), whose "Exceptions Register" and "Pre-Commit, Pre-Push, And Local
> Gate Rules" this directory operationalizes for the frontend.

## The contract

Every exception MUST be filed from [exception-template.md](./exception-template.md) and MUST carry:

- **Owner** — a named person accountable for the exception's continued existence.
- **Expiry** — a date on which the exception is re-justified or removed. "Permanent" is allowed
  only when the safer alternative is structurally impossible, and even then it is re-reviewed at
  every framework-tier upgrade.
- **Reason** — the concrete failure the gate produces here, not "the rule is annoying".
- **Safer alternative considered** — what was tried or evaluated first, and why it lost.
- **Mitigation** — the compensating control that covers the risk the gate would have covered.

The suppression site in code MUST reference its exception (a comment naming the doc). The release
checklist audits expiry dates on every release
([docs/sdlc/release-checklist.md](../sdlc/release-checklist.md)); an expired exception blocks
release.

## What requires an exception

| Suppression                                                       | Gate bypassed                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------- |
| `// eslint-disable-*` in source                                   | `npm run lint` with `--max-warnings=0`               |
| Rule set to `'off'`/downgraded in `apps/web/eslint/*.config.mjs`  | the rule's whole surface                             |
| `@ts-expect-error` / `as unknown as` bridge                       | strict typecheck                                     |
| Skipped test / lowered coverage threshold                         | `npm run test:coverage` gates in `vitest.config.mts` |
| Accepted vulnerability / audit filter                             | `npm run security:audit` / `npm run security:scan`   |
| Raw (untranslated) user-facing copy                               | `no-raw-i18n-text`                                   |

## Currently active exceptions

> Seed exceptions carried from the frontend-OS baseline, adapted to `apps/web` paths. Each is
> re-confirmed against the actual `apps/web` code as the migration lands; remove any that no
> longer apply.

### EXC-0001 — `sonarjs/no-hardcoded-passwords` off

- **Where**: `apps/web/eslint/sonar.config.mjs` (rule set to `'off'`).
- **Reason**: the rule cannot distinguish i18n keys, test ids, and form field ids that mention
  "password"/"secret" from real credentials; in this codebase every hit was a false positive.
- **Mitigation / ownership**: secret detection is owned by the Trivy secret scanner
  (`npm run security:scan`) locally and in the security CI workflow.

### EXC-0002 — `security/detect-object-injection` off

- **Where**: `apps/web/eslint/security.config.mjs` (rule set to `'off'`).
- **Reason**: flags every computed property access; near-100% false positives in strictly typed
  code.
- **Mitigation / ownership**: object-injection risk is controlled by TypeScript strictness
  (`noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess`) and Zod-validated boundaries
  via `parseSchema` from `@/packages/zod`.

### EXC-0003 — English fallback copy in the global error boundary

- **Where**: `apps/web/src/shared/constants/fallback-copy.constants.ts` (`FALLBACK_ERROR_COPY`),
  consumed by `apps/web/src/app/global-error.tsx`.
- **Reason**: `global-error.tsx` renders when the app shell — including the next-intl provider —
  has crashed; there is no i18n runtime left to translate with. This is the single exception to
  the "all copy is translated" rule ([rules/12-i18n.md](../../rules/12-i18n.md)).
- **Mitigation**: copy is confined to one `as const` constant with three keys (title, description,
  retry); no other file may import untranslated copy.

### EXC-0004 — resolver cast in the forms wrapper

- **Where**: `apps/web/src/packages/forms/use-app-zod-form.hook.ts` — the
  `as unknown as Resolver<TFieldValues>` bridge around `zodResolver`.
- **Reason**: `zodResolver` from `@hookform/resolvers` cannot carry an abstract `TFieldValues`
  through its overloads under `exactOptionalPropertyTypes`; the cast is the single sanctioned
  bridge between the vendor generics and our generic facade.
- **Mitigation**: the runtime contract (schema output equals form values) is guaranteed by the
  wrapper itself; the cast exists in exactly one file, owned by the forms package, and is
  re-evaluated on every `@hookform/resolvers` upgrade.

## Lifecycle

1. File the doc from the template with a new `EXC-NNNN` id, get architect approval in the same PR
   as the suppression.
2. Add the register entry above.
3. On expiry: remove the suppression, or re-justify with a new expiry and a note on why removal is
   still blocked.
4. When removed: mark the doc superseded (do not delete) and record the lesson in
   [memory/known-pitfalls.md](../../memory/known-pitfalls.md) if it generalizes.
