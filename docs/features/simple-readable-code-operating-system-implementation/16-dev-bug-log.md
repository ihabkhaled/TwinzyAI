# 16 — Developer Bug Log

| Defect | Severity | Root cause | Resolution | Retest |
| --- | --- | --- | --- | --- |
| 320 px document overflow by 16 px | High CI | React Query devtools launcher from a reused local-mode server | CI always starts a test-mode server; mocked API is same-origin; document-level assertions reused | Playwright 72/72 |
| Runtime sent photo to generation/judge | Critical privacy | Superseded pivot left code and canon split | Image removed from downstream types/calls/prompts; static rule + modality tests | Unit/integration pass |
| Multipart could buffer before consent and leak on parser errors | Critical privacy | Consent enforced only in use case; parser lacked cleanup ownership | Consent must precede file; parser wipes on all post-buffer failures | Parser + integration pass |
| Busy/duplicate/queued-disconnect streams retained upload | High privacy/memory | Presenter returned before use-case cleanup | Shared wipe helper on every early terminal path; queue accepts cancellation | Unit/integration pass |
| Image-capable shadow/non-Gemini routing | High privacy | Configurable vision/shadow expansion | Extraction Gemini-only; image shadows/config removed; compat adapter fails closed | Router/adapter tests pass |
| Canonical disclaimer failed share safety scan | High functional | Negative disclaimer contained forbidden mechanism names | Require exact server disclaimer; scan all other text | Share unit/integration pass |
| Translation accepted unsafe originals/shape drift | High safety | Only translated output was scanned; shallow canonical overwrite | Pre-scan original and recursive shape guard | Integration pass |
| Frontend stale share URL after new/translated result | Medium functional/privacy | Link cache keyed only by hook lifetime | Result fingerprint resets link/mutation/modal state | Hook tests pass |
| Dark-system theme toggle hydration mismatch | Medium UI/accessibility | `aria-pressed` exposed browser-resolved theme before the preferences store hydrated | Gate the pressed state on `hasHydrated`; cover provisional dark and hydrated dark states | UI-preferences unit tests pass |
| Docker clean install failed peer resolution | Release blocker | Experimental TypeScript API package violated Madge/tool peers | Peer-compatible TS 5.9 API + explicit native TS7 checker scripts | Docker build/health pass |
| Dead exports/config and stale wrappers | Maintainability | Partial cleanup slices and speculative surfaces | Knip-driven removal; dead driver/forms/virtualization guidance retired | Knip clean |

No open implementation defect remains from this scope. Production release approvals and live AI
quality UAT are governance activities, not hidden code defects.
