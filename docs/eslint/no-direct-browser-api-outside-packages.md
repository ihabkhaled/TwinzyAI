# frontend-architecture/no-direct-browser-api-outside-packages

- **Source:** `apps/web/eslint/architecture-plugin/rules/no-direct-browser-api-outside-packages.mjs`
- **Registered in:** `apps/web/eslint/architecture.config.mjs` (severity `error`)

## What it enforces

Direct access to the browser globals `window`, `document`, `localStorage`, `sessionStorage`,
`navigator`, `matchMedia`, and `crypto` is only allowed inside the owning wrappers
`apps/web/src/packages/browser/` and `apps/web/src/packages/storage/` (plus `apps/web/src/proxy.ts`).
All other code uses the safe facades:

- `@/packages/browser` — `isBrowser`, `getSafeWindow`, `getSafeDocument`,
  `matchesMediaQuery`, `prefersReducedMotion`, `copyTextToClipboard`, `shareResult`,
  `setRootAttribute`, `getRootAttribute`;
- `@/packages/storage` — `readStorageJson` (schema-validated), `writeStorageJson`,
  `removeStorageItem`.

The rule uses scope analysis: only unresolved (truly global) references are reported, so a local
variable named `document` does not false-positive. Test files are exempt.

## Why

In the App Router, every component may render on the server first. A bare `window.` or
`localStorage.` call is the classic hydration-crash and `ReferenceError: window is not defined`
generator, and ad-hoc storage access means unvalidated JSON parsing scattered everywhere. The
facades centralize SSR-absence handling, availability checks, and Zod-validated
(de)serialization in one reviewed place — exactly how the UI-preferences store
(`apps/web/src/modules/ui-preferences/`) persists theme/direction via the storage facade and
syncs the DOM via the browser facade. Twinzy's Web Share / clipboard fallback for sharing a
result also lives here (`shareResult`), so the game never touches `navigator.share` directly.

## Violation

From `apps/web/eslint/architecture-plugin/__fixtures__/invalid/bad-game.service.ts`:

```ts
const consent = localStorage.getItem('upload-consent');
```

Reported as:

`Do not access 'localStorage' directly. Use the safe facade from @/packages/browser or @/packages/storage (SSR-safe, reviewed in one place).`

## Compliant fix

```ts
import { readStorageJson } from '@/packages/storage';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys.constants';

const preferences = readStorageJson(STORAGE_KEYS.uiPreferences, uiPreferencesSchema);
```

For DOM/media/share access:

```ts
import { prefersReducedMotion, setRootAttribute, shareResult } from '@/packages/browser';
```

(Note: Twinzy's privacy doctrine means uploaded images are never persisted at all — they live in
memory and are wiped after analysis; there is nothing to write to storage for them. See
[rules/15-file-upload-security.md](../../rules/15-file-upload-security.md).)

## Options

```jsonc
{ "allowedPrefixes": ["apps/web/src/packages/browser/", "apps/web/src/packages/storage/", "apps/web/src/proxy.ts"] }
```

Defaults shown above; the repo config relies on the defaults. Extend only via
`apps/web/eslint/architecture.config.mjs` review.

## When you hit it

1. Look for an existing facade export in `apps/web/src/packages/browser/` or
   `apps/web/src/packages/storage/` — most needs are covered.
2. If a capability is missing, add it to the wrapper (SSR-guarded), not at the call site —
   see [skills/add-library.md](../../skills/add-library.md) and
   [rules/10-library-modularization.md](../../rules/10-library-modularization.md).
3. General procedure: [skills/fix-eslint-typecheck.md](../../skills/fix-eslint-typecheck.md).
