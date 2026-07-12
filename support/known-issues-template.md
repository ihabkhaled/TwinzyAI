---
id: support-known-issues-template
title: Known Issues Template
type: support
authority: canonical
status: current
owner: repository owner
summary: Template for documenting one known issue during a release or hypercare window; durable items live in the live register.
keywords: [support, known-issues, template, release, hypercare, workaround, escalation]
contextTier: 2
relatedCode: []
relatedTests: []
relatedDocs: [support/known-issues.md, support/escalation-matrix.md]
readWhen: Filing a new known issue for a release/hypercare window.
---

# Known Issues Template

Instantiate one file per issue during a release/hypercare window; issues that outlive the window move into the live register, [known-issues.md](./known-issues.md).

## Issue

[Describe the issue in plain language. Typical Twinzy examples: a class of photos being rejected by the upload chain (size/type/scan), or analyze failing with "try again later" during an AI provider incident.]

## Affected Players

[Who is impacted and under what conditions — e.g. "players uploading photos over 5 MB from certain camera apps", "all players during the provider outage window".]

## Workaround

[Describe any safe workaround — e.g. pick a smaller/standard-format photo; retry later during AI unavailability. Never suggest bypassing consent or validation; those are safety features.]

## Escalation Rule

[When support should escalate and via which runbook — `runbooks/api-outage.md` for the site being down, `runbooks/ai-provider-outage.md` for analyze failures. Evidence to gather: timestamp, error message shown, request id if available. Any player report of identity/biometric-sounding wording escalates immediately to engineering as a safety issue.]
