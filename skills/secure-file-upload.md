# Skill: Touch File-Upload Code Safely

> Applies rules/15. The riskiest area of the codebase.

1. Read rules/15 and docs/file-upload-security.md first.
2. Any new check joins the ordered chain in FileSecurityService — never a side channel.
3. Preserve invariants: memory-only, wipe in finally, never log/persist/return bytes.
4. Add TEST_CASES.md entries + tests for every new accept/reject behavior before coding.
5. Re-run the file-security suite: npm run test:file-security.
