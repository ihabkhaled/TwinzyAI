# Skill: Reliability Review

> Applies rules/08.

1. Kill Gemini (bad key/model) -> friendly error, no hang, no leak, buffer wiped.
2. Timeout path -> AI_TIMEOUT envelope within GEMINI_TIMEOUT_MS + margin.
3. ClamAV enabled + unreachable in prod config -> upload rejected (fail closed).
4. Health endpoints accurate; graceful shutdown drains; retry UX works after failures.
