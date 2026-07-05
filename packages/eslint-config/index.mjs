/**
 * Thin package entrypoint. The single source of truth for lint rules lives
 * in the repo-root /eslint folder; this package only re-exports it so other
 * tooling can depend on "@twinzy/eslint-config".
 */
export { default } from '../../eslint/index.mjs';
