# 20 - UAT Report

The owner requested a direct backend, payment-off trial that preserves the enhanced updates.

| Scenario | Expected | Result |
| --- | --- | --- |
| Submit a valid JPEG with consent in free mode | Complete game without any payment dependency | pass in local integration harness |
| Gemini returns the production shorthand | Preserve enhanced evidence and continue | pass |
| Later generation and judge prompts execute | Terminal result includes judged candidate | pass |
| Extraction cannot produce a valid profile | Terminal error; PayPal remains uncaptured | pass |
| Production API image with live Gemini, synthetic avatar, and payment gate off | 204 written traits, candidate generation, judge, aggregation, terminal result | pass |

The attached chat photo was not exposed as a local file to the execution environment, so the
mocked trial used the repository's decoded JPEG fixture. A separate live-provider smoke used a
synthetic avatar. The production trace remains the evidence for the owner's real-image provider
shape. UAT is approved for release subject to remote gates and production deployment health.
