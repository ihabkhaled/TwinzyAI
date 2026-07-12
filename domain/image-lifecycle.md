---
id: domain-image-lifecycle
title: Image Lifecycle — Memory-Only, Extraction-Only, Wiped in Finally
type: domain
authority: canonical
status: current
owner: repository owner
summary: THE canonical statement of the uploaded photo's lifetime — request memory only, sent to trait extraction only, zero-filled in finally on every path, never logged or persisted.
keywords: [image, photo, lifecycle, wipe, zero-fill, memory-only, extraction-only, privacy, no-persistence, redaction]
contextTier: 2
relatedCode: [apps/api/src/modules/game/application/analyze-game-stream.use-case.ts, apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts, apps/api/src/modules/ai/model/ai-provider-adapter.types.ts, apps/api/src/modules/ai/adapters/provider-registry.service.ts]
relatedTests: [apps/api/src/modules/file-security/tests/upload-buffer-cleanup.util.test.ts, apps/api/src/tests/game-analyze.integration.test.ts]
relatedDocs: [docs/privacy-and-data-retention.md, rules/15-file-upload-security.md, docs/ai-safety.md]
readWhen: You touch anything that can see the uploaded photo — upload handling, extraction, adapters, logging, streaming, sharing.
---

# Image Lifecycle — Memory-Only, Extraction-Only, Wiped in Finally

This is the canonical lifecycle statement (`CLAUDE.md`, Twinzy constraint #3). Every claim is
enforced by cited code; other docs must link here instead of restating it.

## The statement

The uploaded photo lives **in request memory only**, is sent to **exactly one pipeline step —
trait extraction —**, and is **zero-filled in a `finally` block** immediately after extraction
on success, failure, and abort. It is never logged, stored, cached, embedded, returned, or
passed to candidate generation, judging, translation, sharing, or display. Those stages
receive no image URL, hash, crop, embedding, or raw metadata.

## Enforcement, point by point

### Memory only — no disk, ever

- Uploads use multer memory storage; "there is never a temp file on disk"
  (`apps/api/src/modules/file-security/application/temporary-file-cleanup.service.ts`,
  doc comment).

### Wipe in `finally` on every path

- Streaming path: `finally { this.cleanup.wipe(file); }` bounds the image lifetime to
  validation + extraction, including abort paths
  (`apps/api/src/modules/game/application/analyze-game-stream.use-case.ts`, lines 118–120).
- Non-streaming twin: same pattern
  (`apps/api/src/modules/game/application/analyze-game.use-case.ts`).
- The wipe zero-fills the buffer: `file.buffer.fill(0)`
  (`apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts`, line 8, via
  `temporary-file-cleanup.service.ts`).
- The SSE presenter also wipes the buffer on every pre-pipeline rejection path (busy,
  duplicate) (`apps/api/src/modules/game/api/game-stream.presenter.ts`).

### Extraction-only — a typed boundary, not a convention

- The AI provider port splits image-capable from text-only methods: only
  `generateFromImage[Stream]` accepts an image; `generateFromText[Stream]` has **no image
  parameter**, so leakage is a compile error
  (`apps/api/src/modules/ai/model/ai-provider-adapter.types.ts`).
- Only `TraitExtractionService` calls the image method — its doc comment: "The ONLY pipeline
  step allowed to send the image to the AI provider"
  (`apps/api/src/modules/ai/application/trait-extraction.service.ts`).
- `AI_IMAGE_STEPS = [GeminiStep.Extraction]` is the only photo-carrying step
  (`apps/api/src/config/gemini-step.constants.ts`, line 62).
- Vision routing is fail-closed and hardcoded: `usableEntriesFor` filters
  `!carriesImage || entry.provider === AiProvider.Gemini`
  (`apps/api/src/modules/ai/adapters/provider-registry.service.ts`, line 82); the
  OpenAI-compat adapter rejects all image calls outright
  (`apps/api/src/modules/ai/adapters/openai-compat.adapter.ts`).
- Downstream stages are text-only by construction: `StyleMatchService` — "By the time this
  runs the image is destroyed"
  (`apps/api/src/modules/game/application/style-match.service.ts`, line 19); the translate and
  share request schemas are strictObjects with no image slot
  (`packages/shared/src/schemas/translate-result.schema.ts`,
  `share-result.schema.ts`).

### Never logged

- Extraction logs only trait counts
  (`apps/api/src/modules/ai/application/trait-extraction.service.ts`).
- Log redaction replaces base64 runs — "the signature of leaked image bytes" — and secrets
  with `[REDACTED]`, capping values at 500 chars
  (`apps/api/src/modules/privacy/lib/log-redaction.helpers.ts`,
  `apps/api/src/modules/privacy/model/privacy.constants.ts`); the Gemini adapter redacts
  provider error text before logging
  (`apps/api/src/modules/ai/adapters/gemini.adapter.ts`).

### Never shared, never shadowed, never persisted

- Share creation actively scans for embedded image data (base64 JPEG/PNG/WebP prefixes,
  `EMBEDDED_IMAGE_PATTERNS`) and rejects it
  (`apps/api/src/modules/share-results/application/share-result-safety.service.ts`,
  `model/share-safety.constants.ts`).
- Shadow-mode routes exist only for the text steps — there is no extraction shadow key in
  `AI_STEP_SHADOW_ROUTE_ENV_KEYS` (`apps/api/src/config/gemini-step.constants.ts`,
  lines 52–56), so image calls are never duplicated.
- There is no repository/database anywhere in the API by design
  (`apps/api/src/modules/privacy/privacy.module.ts`).
- The benchmark harness zero-fills its `--photo` buffer after encoding and drops the image
  after the extraction step (`apps/api/src/benchmark/benchmark-real-runner.ts`).

## Sequence (streaming path)

```
consent → file-security chain → [paywall capture when enabled] → extraction (image → Gemini)
   └───────────────────────────── finally: buffer.fill(0) ─────────────────────────────┘
→ text-only matching (evidence, not image) → judge → aggregate → deliver
```

Code: `apps/api/src/modules/game/application/analyze-game-stream.use-case.ts`
(`extractTraitsAndDestroyImage`, lines 102–121).
