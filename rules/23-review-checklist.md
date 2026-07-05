# 23 — Review Checklist

- [ ] Layer boundaries respected (lint green is necessary, not sufficient)
- [ ] No inline domain definitions; strings via i18n; constants shared
- [ ] Errors mapped to the safe envelope; nothing leaks
- [ ] Image handling: memory-only, wiped in finally, never logged
- [ ] Prompts: image only in trait extraction; text-only elsewhere
- [ ] Tests updated/added; behaviors from TEST_CASES.md covered
- [ ] lint + typecheck + unit + build green locally
- [ ] Docs/memory updated when a decision changed
