# 16 - Internal Bug Log

| Bug ID | Summary | Severity | Status | Re-test result |
| --- | --- | --- | --- | --- |
| AI-2026-07-28-01 | Empty-array prompt examples allowed Gemini to emit bare strings for structured enhanced signals | critical | fixed | prompt contract test passes |
| AI-2026-07-28-02 | Adapter prevalidation rejected shorthand before the service could recover it | critical | fixed | adapter and service now share one bounded normalizer |
| AI-2026-07-28-03 | Canonical fake extraction omitted enhanced sections, hiding drift | high | fixed | fixture now includes valid matching and counterfactual profiles |
| AI-2026-07-28-04 | Safety text collection omitted enhanced leaf values | high | fixed | enhanced unsafe-leaf regression rejects the response |
| AI-2026-07-28-05 | A schema-valid but unsafe extraction stopped after model one instead of using the bounded fallback route | critical | fixed | provider validator now rejects unsafe extraction content so the router advances |
| REL-2026-07-28-01 | API runtime image omitted workspace-local production dependencies such as `@fastify/cookie` | critical | fixed | immutable image starts and health smoke passes |

No blocker defect is knowingly open. Final stability depends on the remaining release gates and
post-deploy smoke evidence.
