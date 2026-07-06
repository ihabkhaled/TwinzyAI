/**
 * TanStack Query correctness rules (exhaustive query deps, stable query
 * client, no rest destructuring of query results).
 *
 * STRANGLER-FIG SCOPE: applied only to the new canonical folders — see
 * FRONTEND_ARCH_FILES in ./architecture.config.mjs. The pre-migration frontend
 * (which uses @tanstack/react-query directly today) stays untouched.
 */

import tanstackQuery from "@tanstack/eslint-plugin-query";

import { FRONTEND_ARCH_FILES } from "./architecture.config.mjs";

export default tanstackQuery.configs["flat/recommended"].map((config) => ({
  ...config,
  files: FRONTEND_ARCH_FILES,
}));
