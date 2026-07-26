# 08 — Architecture Review

Accepted: proxy rewrite preserves existing page owners and avoids duplicating route trees; shared
pure helpers own locale paths, sitemap, RSS, and contact URL construction; UI remains component →
hook → helper/service. Rejected: copying ClawAI chat/database architecture, client-only translation,
unsafe raw XML/HTML, server submission persistence, and middleware API/database calls.
