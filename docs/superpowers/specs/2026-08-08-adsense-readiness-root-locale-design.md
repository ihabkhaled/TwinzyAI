# AdSense Readiness and Root English Locale Design

## Outcome

Twinzy's canonical production root renders English with HTTP 200 and no redirect. Explicit locale
routes remain available, crawler endpoints bypass locale/security-page middleware concerns, and the
AdSense ownership loader appears exactly once in production HTML. Public editorial pages remain
human-first, indexable, internally linked, and accurately represented in robots, sitemap, canonical,
hreflang, and social metadata.

## Routing and locale behavior

- `/` is a special public route: it renders the English homepage directly and ignores a stale locale
  cookie for that request.
- `/en` and every other supported locale root remain available.
- `/en` declares `/` as its canonical to avoid treating duplicate English homepages as distinct.
- Homepage `en` and `x-default` hreflang targets point to `/`; other languages retain `/<locale>`.
- Other unprefixed editorial routes keep their existing permanent redirect to `/en/<path>`.
- `/ads.txt`, `/robots.txt`, and `/sitemap.xml` are excluded by the proxy matcher and remain classified
  as machine paths defensively.

## AdSense and crawler behavior

- `public/ads.txt` contains the single authorized seller line and a terminal newline.
- Production build configuration supplies the public production origin and public AdSense client ID.
- The root layout remains the sole owner of the asynchronous AdSense loader and emits it once on
  eligible editorial pages only.
- Robots and sitemap use the production origin. Share and payment-return pages remain excluded.

## Language transition feedback

Selecting a different supported language immediately sets an `isSwitchingLocale` state. The native
select becomes disabled and an accessible, translated loading indicator appears until full navigation
or server refresh replaces the tree. Invalid and unchanged selections remain no-ops.

## Content quality

The audit treats Google's “Low value content” label as a site-quality signal, not a request for keyword
padding. Existing About, FAQ, Privacy, How It Works, and AI Safety pages already contain substantial
original product-specific content. Help and Terms receive clearer metadata, structured sections, and
internal discovery links using existing reviewed translations wherever possible. No generated doorway
pages or repetitive SEO copy will be introduced.

## Verification

Unit tests cover route classification, root canonical/hreflang rules, proxy behavior, loader state, and
single script rendering. Build and full repository gates validate production output. Fresh curl probes
record status, redirect count, content type, final URL, exact ads.txt body, canonical URLs, sitemap URLs,
robots directives, and AdSense script count.

## Rollback

Revert the focused commit and redeploy. No persistence, schema, API, payment, image, or AI-pipeline
behavior changes.
