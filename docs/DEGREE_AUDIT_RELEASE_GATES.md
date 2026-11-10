# Degree audit release gates

The current student academic-preview API is **provisional and non-authoritative**. Do not advertise it as an official graduation determination or publish certification until each gate is satisfied.

## Implemented on development branch

- Controlled, create-only curriculum draft importer with dry-run and explicit write authorization.
- Source fingerprinting and duplicate curriculum-version protection.
- Authenticated student-scoped transcript readiness and academic preview.
- Cohort-year matching that fails closed when reviewed versions are missing or ambiguous.
- Provisional academic progress evaluation and exploratory GPA calculation.
- Unit tests and GitHub Actions workflows.

## Required before a full pilot

1. Obtain written Registry-approved requirements for all ten 2028 programmes, including cohort applicability and transfer rules.
2. Reconcile the 2028 workbook's printed totals with its calculated course credits; retain unresolved differences as blockers.
3. Implement a separately authorized curriculum review and approval workflow with reviewer identity, audit trail and immutable source fingerprints.
4. Obtain permitted student transcript fixtures, document course equivalences, retakes, transfer credits and exclusions, and verify the official GPA scale.
5. Confirm internship, service learning, writing lab, holds, and financial clearance applicability per programme and cohort.
6. Add API integration tests with an isolated test database, role-isolation checks, invalid-input and dependency-failure tests.
7. Build and test student, advisor and admin user interfaces for the provisional results and data quality issues.
8. Complete security review: secret management, rate limiting, retention policy, least privilege, backup and restore, accessibility and privacy.
9. Deploy a staging environment and perform user acceptance testing with authorized stakeholders.
10. Obtain explicit Registry signoff before enabling any official certification decision.

## Operational rules

- Keep draft PR #2 unmerged until all required CI checks complete successfully and a reviewer approves.
- Never import or alter live student records without explicit authorization.
- A passing unit test does not establish the correctness of university policy.
- Academic requirements met is not equivalent to graduation eligible or degree conferred.
