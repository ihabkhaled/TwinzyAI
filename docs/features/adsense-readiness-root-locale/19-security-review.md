# 19 — Security Review

No authentication, authorization, image, AI, payment, storage, or sensitive-data boundary changed.
The AdSense publisher ID is intentionally public. Existing CSP nonce and route eligibility remain in
force. The repository security scan identified newly disclosed transitive dependency advisories during
delivery; fixed-version overrides update only those transitive packages and are verified by the same
unit, E2E, build, and scanner gates.
