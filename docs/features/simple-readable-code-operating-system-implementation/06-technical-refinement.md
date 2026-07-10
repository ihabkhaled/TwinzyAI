# 06 — Technical Refinement

## Technical context

TwinzyAI is an npm-workspaces monorepo: NestJS/Fastify API, Next.js web app, shared Zod contracts, custom ESLint architecture plugins, Vitest, and Playwright. The repository already implements the Simple Code Ladder and declaration rules, but runtime and governance drift remains.

## Alternatives considered

1. Create every filename listed in the request. Rejected: duplicates existing canonical owners and violates reuse-before-creating.
2. Keep multimodal generation/judging and only edit docs. Rejected: contradicts the latest explicit privacy requirement.
3. Hide horizontal overflow globally or loosen the test. Rejected: masks the defect.
4. Remove all filesystem security checks. Rejected: weakens static security.
5. Chosen: extend existing owners, make generation/judging text-only by type/call shape, diagnose the exact overflowing element, and use narrow documented static configuration only where trusted CLI paths are inherently dynamic.

## Chosen approach

- `AI_IMAGE_STEPS` contains extraction only.
- Candidate generation and judging call `generateFromTextStream`; their inputs no longer carry `AiImageInput`.
- Analyze use cases build/pass image only to extraction and wipe the source buffer in `finally`.
- Prompts 2/3 receive written evidence only and retain Zod/safety filtering.
- Tests assert image-call count/step and text-call steps.
- Governance content stays in rules 28–30, consolidated skills/docs/context/memory, and compact mirrors.
- The mobile defect is fixed in the smallest owning CSS/config component after runtime evidence.

## Debt impact and open technical questions

This reduces privacy exposure and API coupling. Historical pivot artifacts remain historical records but must be clearly superseded. Exact overflow owner will be confirmed by DOM measurement before editing.
