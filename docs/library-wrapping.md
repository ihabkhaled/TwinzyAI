# Library Wrapping

Policy: every third-party library is wrapped in exactly one module; business code imports the
wrapper. Swapping implementations (e.g. Nest logger -> pino) touches one folder only.

Current wrapper map: see memory/library-boundaries.md. Enforcement: architecture ESLint rules
no-direct-sdk-imports, no-raw-library-imports, no-direct-env-access. Adding a library: follow
skills/add-library.md — evaluate, document in docs/package-decisions.md, create the wrapper,
add the package to the lint policy lists (eslint/architecture-plugin/shared/policy-utils.mjs).
