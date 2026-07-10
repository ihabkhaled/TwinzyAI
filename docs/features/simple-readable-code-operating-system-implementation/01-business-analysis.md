# 01 — Business Analysis

## Problem

TwinzyAI already has strong architecture and much of the Simple Code OS, but its guidance is fragmented, the prior feature record contains only intake, lint currently emits warnings, and the implementation contradicts the stated text-only post-extraction privacy promise. A deterministic 320 px overflow also blocks web E2E CI.

## Stakeholders and personas

- Players need an honest, private, mobile-first game.
- Product and support need behavior that matches public copy.
- Engineers and reviewers need one obvious owner per declaration.
- AI coding agents need compact, aligned entrypoints and reliable mechanical gates.
- Security/privacy reviewers need a type- and test-enforced image boundary.

## Current and desired state

- Current: substantial rules/skills/context and static enforcement exist; remaining drift and concrete failures reduce trust.
- Desired: canonical policy, runtime, tests, and docs agree; code is direct and ownership-driven; lint is 0/0; 320 px E2E passes.

## Goals and success metrics

- Zero image-bearing provider calls after extraction.
- Zero lint warnings/errors.
- Focused unit/integration/E2E regressions green.
- Full repository gates green or each external blocker recorded with evidence.
- No duplicate governance owner created where an existing rule/skill/doc already covers the concern.

## Assumptions and dependencies

- The 2026-07-10 directive is the latest owner instruction and reinstates the stricter text-only post-extraction boundary.
- Existing uncommitted edits are intentional user work and must be preserved.
- No schema/database migration is required.

## Risk of not delivering

Privacy copy would remain inaccurate, CI would remain red, policy drift would continue, and future human/AI changes would cost more review time.
