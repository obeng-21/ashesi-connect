# Curriculum review rollout gate

The authenticated `POST /api/v1/admin/curricula/review` route is **disabled by default**. Requests return `503 CURRICULUM_REVIEW_DISABLED` unless the server environment explicitly sets `ENABLE_CURRICULUM_REVIEW=yes`.

Do not enable this flag in production until Ashesi Registry approves the programme rules, evidence verification procedure, cohort applicability, and reviewer authorization. An ADMIN JWT alone does not establish Registry authority; the current route does not independently verify an approval reference or support a separate Registry reviewer role. The flag is a temporary operational safety gate, **not** a substitute for those controls.

Before enabling, implement verified reviewer entitlement, independent approval-evidence checks, immutable audit history, concurrency and authorization integration tests, and a documented rollback process. Keep official graduation certification disabled. No import or review action is performed by adding this documentation.
