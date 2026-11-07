# Staging API security smoke test

This is a **manual** smoke-test checklist for a synthetic-data staging environment. It does not imply that staging has been deployed or that integration tests are already running.

1. With `ENABLE_CURRICULUM_REVIEW` unset, POST `/api/v1/admin/curricula/review` using a valid ADMIN bearer token. Expect HTTP 503 `CURRICULUM_REVIEW_DISABLED`.
2. With review enabled but `CURRICULUM_REVIEWER_IDS` unset, expect HTTP 403 `REVIEWER_NOT_AUTHORIZED`.
3. With review enabled and an allowlist excluding the authenticated ADMIN ID, expect HTTP 403.
4. With both gates configured and a malformed payload, expect HTTP 400 `INVALID_INPUT`.
5. With both gates configured and an unknown curriculum, expect HTTP 404 `CURRICULUM_NOT_FOUND`.
6. With a draft containing validation issues, expect HTTP 409 `CURRICULUM_REVIEW_BLOCKED`.
7. With a valid reviewed curriculum, a second review attempt must be rejected.
8. With a STUDENT token, POST review must return HTTP 403, regardless of feature flags.
9. With no token or an invalid token, POST review must return HTTP 401.
10. Student read endpoints must not return another student's academic data or claim `officialCertification:true`.

**Critical:** Do not test actual review promotion against a production database. The current approval evidence is only a supplied reference string and is not independently verified. Keep the review flag disabled outside a tightly controlled synthetic-data environment.
