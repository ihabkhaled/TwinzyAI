# 00 — Intake: Strict Engineering-OS Migration

- **Request ID:** TWZ-OS-001
- **Title:** Replicate a proven strict NestJS engineering operating system onto the Twinzy repository
- **Type:** Platform / architecture migration (governance + tooling + backend refactor)
- **Source:** Repository owner directive (mission brief, 2026-07-05)
- **Owners:** AI staff engineer (implementation); repository owner (approval)
- **Severity/Urgency:** High / this delivery stream
- **Affected domains:** apps/api (all modules), root tooling, knowledge layers (rules/skills/memory/context/testing/agents/docs), dependency set, security posture
- **Explicitly out of scope:** apps/web feature work (parallel workstream in flight - must not be disturbed); any behavioral change to the public API contract
- **Delivery track:** standard (phased slices, gates green per slice)
- **Critical-risk flags:** upload pipeline platform swap (Express to Fastify), dependency major upgrades, shared root tooling (used by the parallel web workstream)
- **Initial scope:** copy+adapt the reference engineering-OS knowledge layers; install its tooling kit; migrate apps/api to the canonical layered anatomy (api/application/domain/infrastructure/adapters/model/lib + core/config/bootstrap); enforce vendor swap surfaces via ESLint; latest deps + Trivy clean; all gates green with live smoke evidence.
