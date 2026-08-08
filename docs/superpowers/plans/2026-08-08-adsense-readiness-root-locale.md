# AdSense Readiness and Root English Locale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Twinzy's root render English directly while completing AdSense and crawler readiness and adding visible locale-transition feedback.

**Architecture:** Keep routing decisions in the existing proxy/locale helper owners, SEO URL decisions in focused helpers, and UI transition state in the locale-switcher hook. Keep the root layout as the only AdSense script owner and use public build-time configuration for the non-secret publisher ID and canonical origin.

**Tech Stack:** Next.js 16 App Router, React, TypeScript, next-intl, Tailwind CSS, Vitest, Testing Library, Playwright, Vercel.

## Global Constraints

- `/` renders English with HTTP 200 and no redirect; `/en` and `/ar` remain available.
- `/` is the canonical English homepage; `/en` canonicalizes to `/`.
- `ads.txt` body is exactly `google.com, pub-2415314275784926, DIRECT, f08c47fec0942fa0` plus a terminal newline.
- The AdSense loader is asynchronous, global, CSP-nonced, and emitted at most once on eligible pages.
- Content additions must be original and useful; no keyword stuffing or doorway pages.
- Tests precede implementation and all repository gates remain unchanged.

---

### Task 1: Machine endpoints and root routing

**Files:**
- Modify: `apps/web/src/proxy.test.ts`
- Modify: `apps/web/src/shared/helpers/locale-route.helper.test.ts`
- Modify: `apps/web/src/proxy.ts`
- Modify: `apps/web/src/shared/helpers/locale-route.helper.ts`

**Interfaces:**
- Consumes: `isMachinePath(pathname: string): boolean`, Next.js proxy matcher configuration.
- Produces: direct root English rendering and middleware exclusion for all three crawler endpoints.

- [ ] Add failing assertions for `/ads.txt`, direct `/`, and matcher exclusions.
- [ ] Run focused Vitest and confirm failures describe the missing behaviors.
- [ ] Implement the smallest proxy/helper changes.
- [ ] Run focused Vitest and confirm green.

### Task 2: Canonical homepage alternates and production AdSense configuration

**Files:**
- Modify: `apps/web/src/shared/helpers/locale-route.helper.test.ts`
- Modify: `apps/web/src/shared/helpers/locale-route.helper.ts`
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/packages/adsense/adsense-script.test.tsx`
- Modify: `apps/web/vercel.json`

**Interfaces:**
- Consumes: `buildLocalizedAlternates(locale, path)`, `publicEnv.siteBaseUrl`, `publicEnv.adsenseClientId`.
- Produces: root-canonical English homepage metadata and one configured production loader.

- [ ] Add failing tests for root English canonical/hreflang and one loader tag.
- [ ] Run focused tests and verify the expected failures.
- [ ] Implement metadata/helper/build configuration changes.
- [ ] Run focused tests and verify green.

### Task 3: Accessible language-switch loading state

**Files:**
- Modify: `apps/web/src/modules/ui-preferences/test/use-locale-switcher.hook.test.ts`
- Modify: `apps/web/src/modules/ui-preferences/types/ui-preferences.types.ts`
- Modify: `apps/web/src/modules/ui-preferences/hooks/useLocaleSwitcher.hook.ts`
- Modify: `apps/web/src/modules/ui-preferences/containers/locale-switcher.container.tsx`
- Modify: `apps/web/src/shared/components/layout/app-header.variants.ts`
- Modify: `apps/web/src/shared/constants/test-ids.constants.ts`

**Interfaces:**
- Produces: `LocaleSwitcherController.isSwitchingLocale: boolean` alongside the existing locale and handler.

- [ ] Add failing hook/component assertions for immediate busy state, disabled input, and no-op selections.
- [ ] Run focused tests and verify the expected failures.
- [ ] Add minimal hook state and accessible spinner presentation.
- [ ] Run focused tests and verify green.

### Task 4: Content/indexability audit and delivery evidence

**Files:**
- Modify: `apps/web/src/app/help/page.tsx`
- Modify: `apps/web/src/app/terms/page.tsx`
- Modify: `docs/features/adsense-readiness-root-locale/*`
- Create: `release-notes/adsense-readiness-root-locale.md`

**Interfaces:**
- Consumes: existing translated Help/Terms copy and content-link helpers.
- Produces: descriptive metadata, stronger navigation, audit findings, and reproducible production checks.

- [ ] Add metadata/render regression assertions where missing.
- [ ] Improve page structure and internal discovery without unreviewed SEO copy.
- [ ] Run web unit tests and inspect server-rendered output.
- [ ] Record curl and gate evidence, limitations, rollback, and deployment follow-up.

### Task 5: Full verification, commit, and push

**Files:** all files changed by Tasks 1–4.

- [ ] Run formatting, lint, typecheck, unit, coverage, integration, E2E, build, security, and Knowledge gates.
- [ ] Re-run lint and the full Knowledge gate on the exact final formatted revision.
- [ ] Run production curl checks and record results without claiming undeployed changes are live.
- [ ] Review the diff, create one conventional commit, push without bypassing hooks, and stop on any red remote gate.
