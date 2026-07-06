# Runbook — Release Smoke Test

Run this after **every** deploy of Twinzy, before declaring the release healthy. It exercises the health surface, the analyze happy path, and the canonical failure envelopes, then verifies the logs behave as designed. Record results in the request's `25-release-report.md`.

Prerequisite: a small valid test image on hand (e.g. `fixture.jpg`, a synthetic image well under 5 MB — never a real person's photo; see `apps/api/src/tests/fixtures/image-fixtures.ts` for how test images are constructed).

## 1. Bring the stack up

```bash
docker compose up -d --build
docker compose ps          # api (4000) and web (3000) Up; clamav too if the profile is enabled
```

## 2. Health + security headers

```bash
curl -i http://localhost:4000/api/v1/health
```

Expected:

- Status `200`
- Header `x-content-type-options: nosniff` present (helmet active — if this header is missing, the security middleware chain is broken; stop and investigate)

## 3. Analyze happy path (fixture image)

```bash
curl -i -X POST http://localhost:4000/api/v1/game/analyze \
  -F "consent=true" \
  -F "file=@fixture.jpg;type=image/jpeg"
```

Expected: `200` with a valid game result payload (traits/match content and the disclaimer copy). This proves the full chain: consent → upload security chain → AI provider → validation/safety filter → response.

## 4. Failure envelopes (all must be the `ApiErrorResponse` shape)

### 4a. 400 — missing consent

```bash
curl -i -X POST http://localhost:4000/api/v1/game/analyze \
  -F "file=@fixture.jpg;type=image/jpeg"
```

Expected: `400`, envelope with the consent-required error code and a friendly message. Consent is checked **before** any file processing.

### 4b. 404 — unknown route

```bash
curl -i http://localhost:4000/api/v1/nope
```

Expected: `404` in the standard envelope — no stack trace, no framework HTML page.

### 4c. 413 — oversize upload

```bash
# Create a >5 MB dummy file (over MAX_IMAGE_SIZE_BYTES default 5242880)
dd if=/dev/zero of=big.jpg bs=1M count=6
curl -i -X POST http://localhost:4000/api/v1/game/analyze \
  -F "consent=true" \
  -F "file=@big.jpg;type=image/jpeg"
```

Expected: `413`, envelope with the file-too-large error code and the friendly size message.

## 5. Verify the logs

```bash
docker compose logs --tail=100 api
```

Confirm in the structured pino JSON:

- Each smoke request appears with a request id, and all lines for one request share that id.
- The 4xx cases from step 4 were logged at **`warn`** level, carrying their error code and `messageKey` (e.g. an `errors.*` key for the consent rejection) — not at `error`.
- No `error`-level (5xx) entries were produced by the smoke tests.
- No sensitive content in any line: no image bytes, no base64 payloads, no `GEMINI_API_KEY`.

## 6. Web spot-check

Open `http://localhost:3000` (or the deployed URL) and run the upload → consent → result flow once in the browser.

## Result recording

| Test | Expected | Result |
| --- | --- | --- |
| Health + nosniff header | 200 + header | pass / fail |
| Analyze happy path | 200 result payload | pass / fail |
| Missing consent | 400 envelope | pass / fail |
| Unknown route | 404 envelope | pass / fail |
| Oversize upload | 413 envelope | pass / fail |
| Logs: 4xx as `warn` with messageKey, request-id correlation | as designed | pass / fail |
| Web flow | result rendered | pass / fail |

## If anything fails — rollback

Rollback is simple and total in this repository: **no database migrations exist**, so there is never schema state to unwind.

1. `git revert` the release slice (the commit or commits of this release).
2. `docker compose up -d --build`
3. Re-run this smoke test against the rolled-back build.

See [`rollback-template.md`](./rollback-template.md) for the full procedure, and [`api-outage.md`](./api-outage.md) / [`ai-provider-outage.md`](./ai-provider-outage.md) if the failure looks like an outage rather than a regression.
