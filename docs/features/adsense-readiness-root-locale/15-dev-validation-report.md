# 15 — Development Validation Report

**Environment:** Windows workspace, 2026-08-08, operator Codex.

## Root-cause evidence

- Existing production web alias served crawler files correctly, but `/` redirected once to `/en`.
- `twinzy-ai-web-6jzq.vercel.app` is the API deployment and returned JSON 404 for every web route.
- Source omitted `/ads.txt` from machine classification and all three root crawler files from the matcher.
- The Vercel web build command omitted canonical-origin and AdSense-client environment values.
- Localized pages used unlocalized canonical metadata.
- A first locale-loader implementation used full reload on `/game`; E2E caught result loss, and the fix
  uses `router.refresh()` in a React transition for non-editorial game state.

## Automated evidence

- Focused regression tests: 33/33 passed before the final transition coverage additions.
- Full unit: 1,209/1,209 passed.
- Coverage: 1,266/1,266 passed; repository summary 97.47% statements, 90.04% branches,
  97.66% functions, 97.60% lines. Additional tests cover the touched hook fallback branches.
- Integration: passed.
- E2E: initial run 74 passed/4 failed and exposed game-state loss; retest 78/78 passed.
- Production-configured build: passed after replacing a non-static matcher expression with a Next.js
  statically analyzable literal.
- Security: initial scan found four new HIGH transitive advisories; dependencies were upgraded to fixed
  versions and require a clean retest before push.

## Production probes before deployment

| URL | Status | Redirects | Content type | Final URL |
| --- | ---: | ---: | --- | --- |
| `https://twinzy-ai-web.vercel.app/` | 200 | 1 | `text/html; charset=utf-8` | `/en` |
| `/ads.txt` | 200 | 0 | `text/plain; charset=utf-8` | `/ads.txt` |
| `/robots.txt` | 200 | 0 | `text/plain; charset=utf-8` | `/robots.txt` |
| `/sitemap.xml` | 200 | 0 | `application/xml` | `/sitemap.xml` |
| `/about`, `/faq`, `/help`, `/privacy`, `/terms` | 200 | 1 each | `text/html; charset=utf-8` | `/en/<path>` |

The deployed `ads.txt` body already matched the authorized seller record. The deployed AdSense script
count was zero, consistent with the missing production build input. Post-push probes must confirm the
new root, script, canonical, and sitemap behavior after Vercel deployment completes.
