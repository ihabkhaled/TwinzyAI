# 08 — Architecture Review

- **Fit:** target anatomy = context/architecture-map.md (canonical). Existing modules map 1:1; no domain redesign.
- **Boundary changes:** managers/ dissolves into application/ (use-cases + services); controllers/ becomes api/; adapters stay; new core/ + bootstrap/ cross-cutting homes; common/ dissolves into core/.
- **Contract changes:** none external. Error envelope gains messageKey (additive).
- **Data-flow:** unchanged (upload, file-security chain, trait extraction, text-only candidate/judge, aggregation; buffer wiped in finally).
- **ADRs:** adr-001-strict-engineering-os.md (adoption); adr-002-zod-validation-vendor.md.
- **Risks:** multipart parsing differences (multer vs @fastify/multipart) on field/file ordering and limits - covered by existing integration tests (consent-missing, second-file, oversize paths).
