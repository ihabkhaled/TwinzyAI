# Bug Triage & Retest Standard

> How a defect is classified, reproduced, root-caused, fixed, and retested — with a failing test **first** and no defect closed without a verified retest. This implements the testing canon ([/testing/testing-strategy.md](./testing-strategy.md)) and [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) (bug fixes ship a reproducing regression test) under [/rules/00-non-negotiable-rules.md](../rules/00-non-negotiable-rules.md) (no behavior change without tests + docs). Defects and their retests are recorded in the feature's SDLC artifacts: `docs/features/<slug>/16-dev-bug-log.md` and `docs/features/<slug>/18-defect-cycle-log.md` (templates: [16-dev-bug-log.md](../docs/features/_template/16-dev-bug-log.md), [18-defect-cycle-log.md](../docs/features/_template/18-defect-cycle-log.md)).

A bug is not fixed when the symptom disappears. It is fixed when the root cause is understood, a test reproduces it (red → green), regression covers it, and the original reproduction steps now produce the expected behavior. Triage is the same disciplined pipeline as a feature — only the entry point differs.

---

## 1. Lifecycle at a glance

```text
Open → In Progress → Fixed → (retest) → Verified → Closed
                                  ↓ fails
                              Reopened → In Progress
```

| Status | Meaning | Who sets it |
| --- | --- | --- |
| Open | Reported in `16-dev-bug-log.md`, awaiting triage/assignment | Reporter |
| In Progress | A reproducing test is being written and the fix is underway | Engineer |
| Fixed | Fix committed; reproducing test now green; gates pass | Engineer |
| Verified | Retest of the exact steps passed; evidence in `18-defect-cycle-log.md` | Reporter / QA |
| Closed | Adjacency + regression passed; merged | Reporter / QA |
| Reopened | Symptoms recurred or fix was incomplete | Reporter / QA |

The order is non-negotiable: **reproduce → write failing test → root-cause → fix → retest**. Skipping any step is how a "fix" ships that only masks a symptom.

---

## 2. Defect report — required fields

An incomplete report is returned to the reporter before triage. Capture, at minimum (in the feature's `16-dev-bug-log.md`):

| Field | Notes |
| --- | --- |
| Id | Sequential `BUG-<n>`; link the feature folder under `docs/features/<slug>/` and the PR |
| Title | Specific and searchable — see below |
| Severity | `S1`–`S4` (impact; §3) |
| Priority | `P0`–`P3` (urgency; §4) |
| Module / layer | The `apps/api/src/modules/<feature>` (or web feature) and layer involved |
| Found in | Commit / branch / release |
| Environment | Local, CI, Docker, staging |
| Steps to reproduce | Exact, numbered, no "sometimes"; the exact request shape (consent field, file type/size) |
| Expected vs actual | What should happen vs what happens — status + `errorCode`, not paraphrase |
| Evidence | Sanitized logs, request/response sample — never a user image, secret, or PII |
| Root cause | Filled by the engineer after investigation (§6) |

**Titles** name the module, the action, and the symptom — they are searchable:

| Bad | Good |
| --- | --- |
| Upload broken | `Game: 500 instead of 400 on POST /game/analyze when the file field is empty` |
| AI weird | `AI: judge response with forbidden wording reaches the client unsanitized` |
| Slow | `Game: analyze accepts an 11th request in the throttle window instead of 429` |

---

## 3. Severity — impact on the system

Severity is assigned by the reporter and confirmed at triage. It describes harm, independent of how fast we choose to fix it.

| Sev | Definition | Illustrative examples |
| --- | --- | --- |
| **S1 — Critical** | Privacy/safety promise broken, or system unusable; no workaround | Image buffer not wiped on a failure path; image bytes in a log line or response; consent gate bypassable; a forbidden-wording or identity-claim response reaching the client; a secret/API key in an error body; ClamAV failing **open** in production mode |
| **S2 — Major** | The primary workflow is blocked; any workaround is unreliable | The analyze route always 500s; a valid JPEG rejected by the decode stage; the throttle never firing (unbounded provider spend); the fallback path crashing on an empty candidate list |
| **S3 — Minor** | Secondary behavior degraded; a simple workaround exists | Wrong `errorCode` for a correctly rejected file; a misleading (but sanitized) error message; a duplicate log line |
| **S4 — Cosmetic** | No functional impact | An inconsistent log prefix; a typo in a non-user-facing string |

A latent **privacy or safety** defect is **S1 even with no live impact** — the absence of an exploit is not the absence of the hole. This mirrors the AI-safety and privacy canon ([/rules/14-ai-safety.md](../rules/14-ai-safety.md), [/memory/privacy-decisions.md](../memory/privacy-decisions.md)).

---

## 4. Priority — urgency to fix

Priority is set at triage from severity, blast radius, and release timeline.

| Pri | Meaning | Default response |
| --- | --- | --- |
| **P0 — Blocker** | Any S1; anything blocking other testing or exposing user data | Fix starts immediately; treat as a hotfix |
| **P1 — Critical** | Most S2; S3 on the critical path (consent, upload chain, safety filter) | Fix this cycle; cannot ship without it |
| **P2 — Major** | Remaining S2 with reliable workarounds; S3 on secondary features | This cycle if capacity allows, else next with justification |
| **P3 — Minor** | All S4; S3 with trivial workarounds on rarely-used paths | Backlog |

### Severity → priority matrix

| | P0 | P1 | P2 | P3 |
| --- | --- | --- | --- | --- |
| **S1** | Always | — | — | — |
| **S2** | If it blocks release | Default | If a workaround exists | — |
| **S3** | If it blocks other testing | If critical-path | Default | If trivial workaround |
| **S4** | — | — | If demo-visible | Default |

**Disputes:** escalate to the technical owner; default to the **higher** severity until resolved; record the rationale for the final call.

---

## 5. Reproduce before you fix

No fix attempt begins until the bug reproduces from the reported steps. A bug you cannot reproduce, you cannot prove fixed.

If it won't reproduce, vary one axis at a time:

- **Environment** — local vs CI vs Docker (`npm run docker:up`); Node version; a stale `packages/shared/dist` (run `npm run build:shared` — a stale build is a classic false "cannot reproduce").
- **Input shape** — the exact file type/size/name from the report; consent as string vs boolean; multipart field order.
- **Provider state** — which fake responses were queued; malformed vs slow vs failing provider.
- **Timing** — rapid repeats to surface a throttle-window or concurrency issue.
- **Boundary** — at, above, and below limits (the size cap, minimum dimensions, `TRAIT_KEYS.length`, empty candidates).

If it is genuinely intermittent, document the reproduction rate (e.g. "3/10"), add structured logging via the logger (`AppLogger`, `apps/api/src/core/logger`) to capture the conditions, and **do not close it as "cannot reproduce"** while the rate is non-zero.

```text
Reproducible ⇔  steps are exact · environment fixed · input shape captured · observed every run (or rate recorded)
```

---

## 6. Root-cause categories

Classify every fix so recurring classes surface. Most categories map to a rule that should have prevented them — the fix usually closes a rule gap, not just one line.

| Category | Symptom | Rule it points back to |
| --- | --- | --- |
| Logic error | Wrong result from a service or use-case branch | [/rules/19](../rules/19-services-application-layer.md), [/rules/16](../rules/16-backend-architecture.md) |
| Missing validation | A bad payload reaches the pipeline instead of 400 | [/rules/21](../rules/21-dto-validation.md) |
| Upload-chain gap | A hostile file passes a stage it should fail (magic bytes, decode, scan) | [/rules/15](../rules/15-file-upload-security.md) |
| AI-safety gap | Forbidden wording / identity claim / unvalidated provider JSON reaches downstream | [/rules/14](../rules/14-ai-safety.md) |
| Privacy gap | Buffer not wiped on a path; image bytes logged or echoed | [/rules/06](../rules/06-security.md), [/memory/privacy-decisions.md](../memory/privacy-decisions.md) |
| Missing null/undefined handling | Crash on an absent optional field | [/rules/11](../rules/11-eslint-typescript.md) |
| Wrong constant / magic literal | Domain value compared against a raw string or number | [/rules/05](../rules/05-types-enums-constants.md) |
| Rate-limit / abuse gap | Throttle not applied or window wrong (429 missing) | [/rules/06](../rules/06-security.md), [/rules/07](../rules/07-performance-scalability.md) |
| Timeout / reliability | Provider hang not bounded; failure not mapped | [/rules/08](../rules/08-reliability-durability.md) |
| Error leakage | Stack/secret/vendor detail reaches the client; missing `errorCode` | [/rules/22](../rules/22-observability-logging.md) |
| Config / env error | Misread or unvalidated config; `process.env` outside the config module | [/rules/00](../rules/00-non-negotiable-rules.md) |
| Adapter / dependency | Vendor SDK called outside its adapter, or its contract drifted | [/rules/10](../rules/10-library-modularization.md) |
| Schema / contract mismatch | `@twinzy/shared` schema, DTO, and consumer disagree (often a stale `dist`) | [/rules/21](../rules/21-dto-validation.md), [/rules/05](../rules/05-types-enums-constants.md) |

---

## 7. Reproduce with a failing test — first

The defining rule of this standard: **before touching the production code, write a test that reproduces the bug.** It must be red for the right reason — failing because of the defect, not a typo. Then make it green with the fix. If you revert the fix, the test must fail again; that is the proof it guards the regression forever.

Pick the layer where the defect actually lives — fix it at the lowest layer that owns the logic, not at the boundary that surfaced it:

| Bug lives in | Reproduce with | Standard |
| --- | --- | --- |
| Service / use-case / lib logic | Unit test in the module's `tests/` folder (`api-unit`) | [/testing/unit-testing-standard.md](./unit-testing-standard.md) |
| DTO parsing, upload chain over HTTP, throttle, error envelope | `*.integration.test.ts` (`api-integration`) | [/testing/integration-testing-standard.md](./integration-testing-standard.md) |
| Shared schema / constant contract | Test in `packages/shared/tests/` (`shared-unit`) | [/testing/unit-testing-standard.md](./unit-testing-standard.md) |
| Architecture rule not firing | `RuleTester` case in `eslint/architecture-plugin/tests/` (`lint-rules`) | [/testing/unit-testing-standard.md](./unit-testing-standard.md) |
| The browser journey | Playwright spec in `apps/web/e2e/` (web workstream) | [/testing/e2e-testing-standard.md](./e2e-testing-standard.md) |

```typescript
// DO — red first: this fails on the buggy code, passes once the wipe moves into finally.
// Bug: the image buffer survived when trait extraction threw.
it('wipes the image buffer when trait extraction fails', async () => {
  adapter.queueImageResponse(new Error('provider down'));
  const file = buildUploadFile();

  await expect(analyzeGame.analyze(file, { consent: 'true' })).rejects.toBeInstanceOf(AppError);
  expect(file.buffer.every((byte) => byte === 0)).toBe(true);
});
```

```typescript
// DON'T — assert the symptom is gone without proving the cause. This passes even if the fix
// only swallowed the error, and it never goes red if the bug returns. It guards nothing.
it('does not crash', async () => {
  await expect(analyzeGame.analyze(file, { consent: 'true' })).rejects.toBeDefined();
});
```

Preserve the scenario (not just the code) as a case under [/test-cases](../test-cases/security/security-test-case-template.md) in the matching category — an escaped defect must leave both artifacts.

---

## 8. Fix requirements

A fix may not move to **Fixed** until all hold:

1. **Covering test** — the reproducing test from §7 is committed and green; reverting the fix turns it red.
2. **Root-caused** — the §6 category is recorded in the bug log; the fix addresses the cause, not the symptom. No silent `catch`, no broadened type, no weakened assertion to make a test pass.
3. **Layer-matched** — the fix sits in the layer that owns the logic and respects the boundaries in [/rules/16-backend-architecture.md](../rules/16-backend-architecture.md). A controller bug is rarely fixed in the controller.
4. **Class, not instance** — if the cause is a recurring pattern (a missing rejection stage, an unmapped provider error, a raw literal), sweep adjacent code for the same hole and cover the representative cases.
5. **Scenario expansion** — add the unhappy/boundary scenarios the original suite was missing, not just the single reproducer.
6. **No new debt** — gates green: `lint`, `typecheck`, `test:unit`, `test:coverage` (floor on touched files), `build`, `security:scan`. No `--no-verify`.
7. **Docs in the same change** — if behavior changed, update the feature docs and the relevant rule/memory note; record the pattern in [/memory/known-pitfalls.md](../memory/known-pitfalls.md).

---

## 9. Retest — no defect closed without it

A fix is the engineer's claim; the retest is the proof. Retest evidence lands in the feature's `18-defect-cycle-log.md`.

- **R1 — Same reporter retests.** The person who found it verifies it; they know the exact conditions and can tell a real fix from a similar-looking symptom.
- **R2 — Exact steps.** Follow the reported steps verbatim — the same file shape, the same consent value, the same request sequence. The original steps must now produce the expected behavior.
- **R3 — Adjacency check.** Verify the features that share the changed code path. A fix in the file-security chain means re-checking **every** rejection stage; a change to a shared AI service means re-running `npm run test:ai`; a shared-schema change means re-checking both API and web consumers. Map dependencies with [/context/codebase-navigation.md](../context/codebase-navigation.md).
- **R4 — Regression for S1/S2.** Run the full automated suite plus the affected pack (`test:security`, `test:file-security`, `test:ai`, or `test:pwa`) and its adjacency. Re-run the *pack*, not just the one failing test — a real regression rarely arrives alone.
- **R5 — Layer-matched verification.** Verify through the layer where the bug lived: re-issue the HTTP request and assert status + `errorCode` + schema-valid body; for a privacy bug, re-assert the buffer/log/traffic invariants; for a browser bug, re-run the Playwright journey.

```text
S3 / S4  →  R1 + R2 + R3
S1 / S2  →  R1 + R2 + R3 + R4 + R5  (full regression mandatory before Close)
```

A defect may move to **Closed** only when: the exact-steps retest passed · adjacency verified · regression green (S1/S2) · the covering test exists and passes · no new defect introduced · the change is merged.

---

## 10. Reopening — trust erosion

Reopen the **same** defect (do not file a new one) when the same symptoms recur, the original steps reproduce it again, or the covering test now fails.

1. Append the new evidence (commit, sanitized logs, steps) to the original entry in `16-dev-bug-log.md` — never overwrite the failing history.
2. **Raise severity by one level** — a defect that escaped a "fix" has shown the previous fix and its test were inadequate.
3. Return to **In Progress**; the new fix must explain why the first reproducing test did not catch the recurrence and must add the case that does.

---

## 11. Hotfix track (P0/S1)

Hotfixes are **faster, not looser** — every step still exists.

- Triage and root-cause are compressed in time, never skipped.
- The reproducing test is still written first; for a true production fire, capture the exact reproduction steps and residual risk in the bug log and backfill the automated test in the same PR before merge.
- For a privacy S1 (image retained/logged), verification must include the negative proof — the buffer/log assertions from [test-data-and-fixtures.md](./test-data-and-fixtures.md) — not just "the error went away."
- Rollback readiness matters **more**, not less: confirm the change is reversible and observable before deploy ([/rules/08-reliability-durability.md](../rules/08-reliability-durability.md), [/memory/release-checklist.md](../memory/release-checklist.md)).
- A retrospective is mandatory; the durable lesson lands in [/memory/known-pitfalls.md](../memory/known-pitfalls.md) and, if it is a permanent rule, in the relevant rule file.

---

## Quality gate

```bash
npm run lint            # 0 errors AND 0 warnings
npm run typecheck       # tsc --noEmit in every workspace
npm run test            # full suite — reproducing test green; revert the fix → it goes red
npm run test:coverage   # floor met on touched files; critical paths near 100%
npm run build           # compiles clean
npm run security:scan   # 0 HIGH/CRITICAL
```

## Checklist

- [ ] Report complete in `16-dev-bug-log.md`: severity, priority, module/layer, exact steps, environment, sanitized evidence
- [ ] Severity (impact) and priority (urgency) assigned via the matrix; disputes default higher and are recorded
- [ ] Bug reproduced from the reported steps (or reproduction rate documented)
- [ ] Root-cause category recorded; fix targets the cause, not the symptom
- [ ] **Reproducing test written first**, red for the right reason, green after the fix, red again if reverted
- [ ] Fix sits at the owning layer; adjacent instances of the same class swept and covered
- [ ] Gates green; touched-file coverage clears the floor; docs + [/memory/known-pitfalls.md](../memory/known-pitfalls.md) updated
- [ ] Scenario preserved under `/test-cases/<category>/`; retest evidence in `18-defect-cycle-log.md`
- [ ] Retest by the same reporter using exact steps; adjacency checked; regression run for S1/S2
- [ ] Reopens raise severity and explain the gap the prior test missed
- [ ] No defect marked Closed without a verified retest

**Related:** [/testing/testing-strategy.md](./testing-strategy.md) · [/testing/quality-gates.md](./quality-gates.md) · [/testing/coverage-policy.md](./coverage-policy.md) · [/testing/test-data-and-fixtures.md](./test-data-and-fixtures.md) · [/rules/09-testing-coverage.md](../rules/09-testing-coverage.md) · [/docs/features/_template/16-dev-bug-log.md](../docs/features/_template/16-dev-bug-log.md) · [/docs/features/_template/18-defect-cycle-log.md](../docs/features/_template/18-defect-cycle-log.md) · [/agents/backend-test-engineer.md](../agents/backend-test-engineer.md) · [/memory/known-pitfalls.md](../memory/known-pitfalls.md)
