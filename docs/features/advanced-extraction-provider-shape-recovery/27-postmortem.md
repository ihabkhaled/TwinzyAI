# 27 - Postmortem

## Incident

- ID: `TWZ-AI-2026-07-28`
- Severity: critical production game-flow failure
- Impact: valid uploads stopped during extraction; candidate generation and judge prompts did not
  execute. PayPal order approval could precede the failure, while capture remained deferred.

## Confirmed Root Cause

Prompt v6 showed a structured object only for one enhanced array and empty examples for sibling
and counterfactual arrays. Gemini consistently returned bare strings in those arrays. Strict
prevalidation rejected the output for each of the three configured entries before generation.
The default fake extraction fixture omitted the enhanced sections, so existing tests did not
reproduce the provider shape.

## Timeline

| Date / time | Event |
| --- | --- |
| 2026-07-28 10:56 +03:00 | Production logs show extraction validation failures and route fallback |
| 2026-07-28 | Correlated request logs confirm all three models returned content but failed shape validation |
| 2026-07-28 | Regression reproduced locally; prompt and bounded provider normalizer implemented |
| 2026-07-28 | Direct mocked backend flow reaches extraction, generation, judge, aggregation, and result |
| 2026-07-28 10:16 UTC | Hook-clean implementation commit pushed to `main` |
| 2026-07-28 10:19 UTC | All GitHub gates green; both Vercel deployments ready; health and logs clean |

## Corrective Actions

| Action | Status |
| --- | --- |
| Add complete object examples for every enhanced array | complete |
| Normalize only observed bounded string shorthand before strict validation | complete |
| Make fake extraction fixtures include enhanced profiles | complete |
| Include enhanced leaves in forbidden-wording safety inspection | complete |
| Retry the next bounded model when an extraction is schema-valid but unsafe | complete |
| Add direct payment-off multipart/SSE regression | complete |
| Record the fixture/prompt pitfall in durable memory | complete |
| Copy API-workspace production dependencies into the runtime image | complete |
| Complete local gates, push gates, deployment, and hypercare | complete |

No enhanced feature was removed, no schema was loosened, and no production payment bypass was
introduced.
