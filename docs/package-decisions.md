# Package Decisions

Policy: latest compatible stable versions with caret ranges; compatibility verified against the
npm registry before adoption; upgrades bump everything that peers allow and document holds.

Key decisions:
- TypeScript ~6.0: latest stable; typescript-eslint supports <6.1.
- tsgo (@typescript/native-preview) REJECTED for now: v7 dev preview, and it does not emit the
  decorator metadata NestJS DI requires. typecheck/build use tsc. Revisit at tsgo GA.
- ESLint 9.39 (maintenance) HELD instead of 10.x: eslint-plugin-react and eslint-plugin-jsx-a11y
  peers do not allow 10 yet. unicorn held at 63 (last eslint-9 line). Revisit when peers widen.
- Zod 4 everywhere (api DTOs, shared schemas, env parsing) — one validation library.
- @google/genai (GA SDK) for Gemini, wrapped in GeminiAdapter.
- No class-validator/class-transformer: Zod replaces them (single library, better inference).
- No shadcn CLI: small hand-rolled accessible primitives keep the dependency surface minimal.
- No next/font Google fonts: system font stack keeps builds offline-reproducible.
- No sharp: image structural validation is pure-TS header parsing; full decode via a native lib
  would add a heavy native dependency — revisit if requirements grow.
- unplugin-swc + @swc/core: required for Vitest to emit Nest decorator metadata.
- supertest for HTTP integration tests; concurrently for the dev script.
- yaml (eemeli, zero-dependency) as a root devDependency for the knowledge compiler
  (scripts/knowledge): parses authored knowledge/*.yaml definitions and document frontmatter.
  Wrapped in scripts/knowledge/lib/yaml-io.mjs per the library-wrapping rule; dev-only, never
  shipped in an app bundle. A hand-rolled YAML-subset parser was rejected as a silent-breakage
  risk for human-edited files.
Rejected plugins: none beyond the documented ESLint holds above.
