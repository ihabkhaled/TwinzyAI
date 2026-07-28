# Product Requirements

## Acceptance criteria

1. Enhanced `matchingProfile` and `counterfactualProfiles` remain in Prompt 1 and downstream
   written evidence.
2. Every enhanced signal-array element is documented as the exact structured object contract.
3. The production-observed non-empty string shorthand is conservatively normalized and then
   validated by the existing strict Zod schema.
4. Numbers, nulls, oversized strings, unbounded arrays, invalid objects, and unsafe text still fail.
5. A payment-off multipart request with a valid image fixture executes extraction, generation, and
   judge and returns a schema-valid result.
6. PayPal remains approved but uncaptured until result-ready; Paymob/captured delivery failures
   remain refundable.
7. At most three configured models are attempted per step.

## Non-goals

No payment bypass in production, no validation weakening, no provider hardcoding, no image
persistence, no image use after extraction, and no change to public game response shape.

