# 01 — Business Analysis

## Problem

The current flow captures PayPal before the failure-prone AI pipeline. Refund is an in-request,
best-effort side effect with no durable ledger. A timeout, process termination, or refund-provider
failure can therefore leave a buyer charged without a result.

## Required outcome

- An AI/file/timeout/disconnect failure before a result exists must not capture a PayPal order.
- A failure after capture but before result emission must attempt an idempotent refund.
- Paywall-disabled behavior remains free.
- Paymob behavior remains verified-and-compensated because its hosted checkout already moves money.

## Value and risk

This restores buyer trust and reduces manual refunds. The change is money-flow critical and must
ship only with focused integration tests and the full repository gates.
