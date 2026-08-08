# 08 — Architecture Review

Approved within existing frontend boundaries: proxy owns request routing; helpers own pure URL rules;
route pages own metadata/composition; the hook owns interaction state; the container renders it; public
environment parsing remains the sole `process.env` reader. No architecture exception or ADR is needed.
