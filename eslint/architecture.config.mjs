import architecturePlugin from "./architecture-plugin.mjs";
import { vendorBoundaryRuleOptions } from "./package-boundaries.config.mjs";

/**
 * Applies the custom architecture rules. Every rule is an error — the
 * architecture is non-negotiable and never weakened to make code pass.
 *
 * Vendor boundaries are config-driven: the policy list (which vendor belongs
 * to which owning module) lives in eslint/package-boundaries.config.mjs —
 * that file is the adaptation point, never the rule implementations.
 * The vendor rule is scoped to apps/api and packages/shared ONLY; apps/web
 * lint behavior is unchanged by it.
 */
export default [
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx", "packages/**/*.ts"],
    plugins: {
      architecture: architecturePlugin,
    },
    rules: {
      "architecture/controller-no-logic": "error",
      "architecture/application-layer-boundaries": "error",
      "architecture/no-restricted-layer-imports": "error",
      "architecture/no-inline-domain-definitions": "error",
      "architecture/no-direct-sdk-imports": "error",
      "architecture/no-direct-env-access": "error",
      "architecture/no-raw-library-imports": "error",
      "architecture/tsx-pure-composition": "error",
      "architecture/repository-persistence-only": "error",
    },
  },
  {
    files: ["apps/api/**/*.ts", "packages/shared/**/*.ts"],
    plugins: {
      architecture: architecturePlugin,
    },
    rules: {
      "architecture/no-restricted-vendor-imports": [
        "error",
        vendorBoundaryRuleOptions,
      ],
    },
  },
];
