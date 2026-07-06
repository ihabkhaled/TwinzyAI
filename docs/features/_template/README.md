# Feature Template Usage

## Purpose

This folder is the master template for any request in the Twinzy repository. Copy it to `docs/features/<feature-slug>/` and keep the numbering and filenames exactly the same.

The phases implement the [Twinzy SDLC policy](../../sdlc/company-sdlc-policy.md). The first fully worked example is [`docs/features/engineering-os-migration/`](../engineering-os-migration/00-intake.md).

## Rules

1. Do not delete a phase file because the request feels small.
2. If a section is not applicable, write `Not applicable`, explain why, and name who accepted that conclusion. (Common in this repo: Twinzy has no database, no auth, and no payments — say so explicitly instead of leaving sections blank.)
3. Keep assumptions visible until they are confirmed or replaced.
4. Link supporting evidence: [`rules/`](../../../rules/README.md), [`testing/`](../../../testing/README.md), [`runbooks/`](../../../runbooks/README.md), ADRs in [`architecture/adrs/`](../../../architecture/adrs/README.md), test cases in [`test-cases/`](../../../test-cases/unit/unit-test-case-template.md), and [`release-notes/`](../../../release-notes/README.md) from the relevant phase document.
5. Update the artifact during the phase; do not backfill it at the end from memory.
6. Do not close a phase only because the main table or summary is filled; the evidence and blocker sections matter too.
7. If a phase document contains a blocker condition that is still true, the phase is not complete.

## Placeholder Conventions

- Replace `<feature-slug>` with a stable slug such as `share-card-v2`
- Replace `<request-id>` with the request ID from `00-intake.md` (format `REQ-YYYY-TWINZY-####`)
- Replace bracketed prompts with actual content

## Minimum Flow

1. Complete `00` through `13`
2. Implement in phase `14` (no artifact file — the code, tests, and PRs are the artifact)
3. Complete `15` through `24`
4. Release in `25`
5. Observe in `26`
6. Learn in `27`

## Minimum Discipline

Every phase document should make it obvious:

- what was decided
- what is still unknown
- what evidence supports the phase outcome
- who owns remaining work
- what would block the phase from being called complete
