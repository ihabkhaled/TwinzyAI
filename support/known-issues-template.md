# Known Issues Template

## Issue

[Describe the issue in plain language. Typical Twinzy examples: a class of photos being rejected by the upload chain (size/type/scan), or analyze failing with "try again later" during an AI provider incident.]

## Affected Players

[Who is impacted and under what conditions — e.g. "players uploading photos over 5 MB from certain camera apps", "all players during the provider outage window".]

## Workaround

[Describe any safe workaround — e.g. pick a smaller/standard-format photo; retry later during AI unavailability. Never suggest bypassing consent or validation; those are safety features.]

## Escalation Rule

[When support should escalate and via which runbook — `runbooks/api-outage.md` for the site being down, `runbooks/ai-provider-outage.md` for analyze failures. Evidence to gather: timestamp, error message shown, request id if available. Any player report of identity/biometric-sounding wording escalates immediately to engineering as a safety issue.]
