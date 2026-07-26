# 14 — Implementation

Implemented the Twinzy-relevant subset of the external pack:

- canonical locale-prefixed public URLs are normalized by the Next.js proxy while the existing App
  Router pages remain the single implementation owners;
- the existing `app/sitemap.ts` remains the `/sitemap.xml` owner;
- `/sitemaps/<locale>.xml` publishes bounded localized URL sets with full hreflang clusters;
- `/<locale>/feed.xml` publishes only static editorial topics and never game/share/user data;
- `/contact` submits a strict shared `{ email, subject, message }` contract to `POST /contact`;
- the API rate-limits contact delivery, fixes the recipient in server configuration, sends plain
  text through its SMTP adapter, and stores neither requests nor delivered messages;
- the existing substantial landing hero and six-section marketing/editorial homepage remain the
  marketing owner and are included in every localized crawl path.

The foreign pack's accounts, database migrations, public-chat indexing, internal token feeds, and
unreviewed thirteenth locale were intentionally excluded.

SMTP delivery is disabled by default and fails closed unless every required `CONTACT_*` variable
is valid. Credentials remain server-only and must never be committed or exposed through
`NEXT_PUBLIC_*`.
