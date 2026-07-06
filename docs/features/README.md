# Features — Request Artifacts

Every request delivered in this repository — feature, fix, refactor, migration, AI behavior change — gets one folder here containing its full phase trail (`00`–`27`) as defined by the [Twinzy SDLC policy](../sdlc/company-sdlc-policy.md).

## How to start a request

1. Copy [`docs/features/_template/`](./_template/README.md) to `docs/features/<feature-slug>/` (e.g., `docs/features/share-card-v2/`).
2. Keep the numbering and filenames **exactly** as they are in the template so reviews, automation, and humans can find the required artifacts quickly.
3. Fill `00-intake.md` first (request ID, owners, classification), then work the phases in order. No implementation before `00`–`13` are documented.
4. Update each artifact **during** its phase — never backfill from memory.

## Worked example

[`docs/features/engineering-os-migration/`](./engineering-os-migration/00-intake.md) is the first fully worked example in this repository: the migration of `apps/api` onto the strict layered engineering OS (Fastify platform, pino request logging, AppError + messageKey error contract, zod-everywhere validation). Read it to see what "filled in properly" looks like — concrete decisions, real gate references, real risks — before writing your own artifacts.

## Rules of the folder

- Filenames from the template are verbatim and immutable; the phase numbers are the contract.
- A phase file that is not applicable still exists — it says `Not applicable`, why, and who accepted that.
- Links inside artifacts must resolve within this repository (rules, testing docs, runbooks, ADRs, test cases).
- The standing baselines these artifacts inherit live in [`docs/sdlc/`](../sdlc/README.md); the enforceable rule bodies live in [`rules/`](../../rules/README.md).
