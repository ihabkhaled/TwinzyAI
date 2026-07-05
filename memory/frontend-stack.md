# Frontend Stack

- Next.js 16 App Router, React 19, Tailwind CSS v4 (CSS-first config via @theme).
- TanStack Query v5 for server state; React Hook Form + Zod resolver for forms.
- No shadcn CLI: hand-rolled accessible primitives in components/ui (documented in
  docs/package-decisions.md).
- System font stack (no next/font network fetch — keeps Docker builds offline-safe).
- Lightweight typed i18n dictionary instead of next-intl (single-locale today; key-typed).
