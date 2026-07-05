# 11 — ESLint & TypeScript

- Flat config split by concern in /eslint, composed in eslint/index.mjs, prettier last.
- Type-aware rules (strictTypeChecked) on all TS; custom architecture plugin enforces layers.
- tsconfig strict flags are frozen (tsconfig.base.json). Fix code, never flags.
- Relaxations require a documented entry in docs/eslint-architecture.md.
