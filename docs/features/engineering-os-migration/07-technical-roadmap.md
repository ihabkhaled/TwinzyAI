# 07 — Technical Roadmap

Slices (each: tests first, then code, then gates, then commit):
1. docs/governance + tooling kit (no runtime change).
2. Backend foundation: bootstrap/ split, core/{logger,errors,validation,rate-limit,openapi,http}, config/ on @nestjs/config+zod, app.module rewire, Fastify boot. e2e-parity tests updated alongside.
3. health module to canonical anatomy.
4. privacy module. 5. result-aggregation. 6. file-security. 7. ai. 8. game (+ multipart swap).
9. ESLint plugin retarget (api layer names) + package boundaries; zero violations.
10. deps latest + lockfile clean install + Trivy remediation.
Branch strategy: main (repo convention), conventional commits per slice through hooks. Rollback: revert the slice commit; no schema/data migrations exist (stateless product).
