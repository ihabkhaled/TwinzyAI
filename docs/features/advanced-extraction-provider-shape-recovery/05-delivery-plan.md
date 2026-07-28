# Delivery Plan

1. Lock the production string-array response as a failing schema/pipeline regression.
2. Lock Prompt 1's exact object examples as a failing prompt-contract regression.
3. Add one provider-boundary normalizer reused by model-chain validation and final parsing.
4. Expand the canonical fake extraction fixture to include enhanced profiles.
5. Run the payment-off multipart/SSE backend flow and payment-on failure regressions.
6. Run full local gates, update evidence, commit, push `main`, wait for CI/deployment, and inspect
   production health/logs.

Rollback is a single commit revert. No configuration or data migration is involved.

