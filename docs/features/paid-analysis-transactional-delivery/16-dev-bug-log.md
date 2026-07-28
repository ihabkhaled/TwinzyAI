# 16 — Development Bug Log

| ID | Finding | Severity | Resolution |
| --- | --- | --- | --- |
| PATD-001 | PayPal captured before failure-prone AI work | Critical | Deferred capture until final result assembly |
| PATD-002 | Refund depended on the same timed-out request and an in-memory capture holder | Critical | Removed capture from the AI interval; retained compensation only for the narrow post-finalization delivery interval |
| PATD-003 | Paid streaming had no regression proving extraction failure does not charge | High | Added paywall-on SSE integration coverage |
| PATD-004 | Shared extraction schema required `written-traits-v6` while Prompt 1 instructed models to return `written-traits-v5` | Critical | Aligned Prompt 1 to v6, retained the advanced profile outputs, and locked version plus profiles in one pipeline regression |
| PATD-005 | Vercel security headers and client addresses appeared in logs | Critical | Redacted all inbound headers plus remote address/port; added behavioral leakage test |
| PATD-006 | SSE event writes silently disappeared after disconnect | High | Writer reports rejection; presenter converts it to a use-case failure so compensation runs |
| PATD-007 | Removing advanced profile output would silently disable catalog-aware matching | High | Restored `matchingProfile` and `counterfactualProfiles`; the extraction prompt regression now fails if either disappears |
| PATD-008 | A production route resolved seven model entries, making one invalid extraction slow and expensive | High | Capped every resolved step route at the first three usable provider/model attempts |
| PATD-009 | Paymob preparation represented money already moved, but the new holder did not mark it refundable until result finalization | Critical | Mark Paymob captures refundable immediately after verification; added JSON and streaming extraction-failure regressions |
| PATD-010 | Vercel runtime logs serialized query parameters separately from the redacted URL, exposing deployment-share tokens | Critical | Redact the complete parsed query object and assert a sentinel share token never reaches log output |
| PATD-011 | The pushed revision failed remote Lint because the commit formatter expanded `app-config.service.ts` to 301 lines after local lint had run | High | Extract route-chain normalization into its existing config utility owner and require final-revision lint after every hook/formatter mutation |
| PATD-012 | The pushed revision failed remote Knowledge because its committed `.ai/` stale-item snapshot did not match a deterministic CI rebuild | High | Rebuild and commit `.ai/` after final authored-file formatting; require drift validation and block later slices on any red remote gate |

## Residual risks

- A provider capture and SSE delivery cannot be globally atomic without a durable ledger/outbox and
  client acknowledgement. A process death after capture but before compensation remains possible in
  a much smaller interval.
- Paymob checkout moves money before the analyze request and still relies on refund compensation.
- Historical affected payments cannot be located from Twinzy because payment identifiers are
  intentionally not persisted or logged; provider-dashboard reconciliation is required.
