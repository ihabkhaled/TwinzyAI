---
id: ai-image-lifecycle
title: Image Lifecycle — AI-Side Specifics
type: doc
authority: canonical
status: current
owner: repository owner
summary: Pointer to the domain image-lifecycle owner plus the AI-side specifics — buildAiImageInput encoding, wipe-in-finally, never logged, never shadowed.
keywords: [ai, image, lifecycle, wipe, buffer, memory, privacy, base64, extraction]
contextTier: 2
relatedCode: [apps/api/src/modules/ai/lib/image-input.util.ts, apps/api/src/modules/game/application/analyze-game-stream.use-case.ts, apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts]
relatedTests: [apps/api/src/tests/game-analyze.integration.test.ts, apps/api/src/tests/game-analyze-stream.integration.test.ts]
relatedDocs: [docs/privacy-and-data-retention.md, docs/ai/written-traits-only-boundary.md, docs/file-upload-security.md]
readWhen: You are touching upload handling, the extraction call, or anything that could extend the image's lifetime.
---

# Image Lifecycle — AI-Side Specifics

**Owners of the full lifecycle:** the domain knowledge area (`domain/image-lifecycle.md`, being
established in the Knowledge-OS workstream) and today
[docs/privacy-and-data-retention.md](../privacy-and-data-retention.md) +
[docs/file-upload-security.md](../file-upload-security.md). This page covers only what the AI
subsystem does with the image.

## The whole AI-side lifetime

```
multer memory storage (never a temp file on disk)
  → file-security chain validates the buffer
  → buildAiImageInput(source) — base64 + mimeType, in lib/image-input.util.ts
  → ONE call: TraitExtractionService → Gemini (fail-closed vision dispatch)
  → finally { cleanup.wipe(file) } — buffer zero-filled, success/failure/abort alike
```

- **Encoding**: [`image-input.util.ts`](../../apps/api/src/modules/ai/lib/image-input.util.ts)
  — `buildAiImageInput` produces `{ mimeType, base64Data }` from the validated upload; its doc
  comment states the result "never crosses into candidate generation or judging".
- **Wipe-in-finally**: both use-cases bound the image's lifetime to validation + extraction —
  `analyze-game-stream.use-case.ts:118-120` and `analyze-game.use-case.ts:72-74`, zero-fill via
  `apps/api/src/modules/file-security/lib/upload-buffer-cleanup.util.ts` (`file.buffer.fill(0)`),
  executed by `temporary-file-cleanup.service.ts` ("multer memory storage, so there is never a
  temp file on disk").
- **Never logged**: extraction logs only trait counts (`trait-extraction.service.ts`); the
  Gemini adapter redacts provider error text before logging and never logs image bytes
  ([provider-catalog.md](provider-catalog.md)).
- **Never shadowed**: shadow routes exist only for text steps; an image is never duplicated to a
  second provider ([shadow-routing.md](shadow-routing.md)).
- **Never persisted, cached, or returned**: the API is stateless with no database; no schema in
  `packages/shared/src/schemas/` has an image field on any response or downstream request
  ([schema-contracts.md](schema-contracts.md)).
- **Benchmark parity**: even the opt-in real benchmark zero-fills the photo buffer after
  encoding and drops the image after the extraction step
  (`apps/api/src/benchmark/benchmark-real-runner.ts`).

## Boundary doc

Which steps may see the image at all — and every mechanism enforcing it — is owned by
[written-traits-only-boundary.md](written-traits-only-boundary.md).
