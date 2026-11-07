# Provisional degree audit — isolated staging acceptance matrix

This checklist is for synthetic records only. It does not authorize production access, academic-policy approval, or degree certification. Execute against the reviewed feature-branch commit and record the exact CI run IDs.

## Preconditions

- Isolated staging MongoDB cluster and explicit `ashesi_graduation_staging` database; never reuse production credentials.
- Synthetic student, advisor, and administrator accounts with distinct credentials.
- Curriculum draft retains source URL, workbook SHA-256, cohort, programme/track/version, and `DRAFT` status.
- No official certification or degree-conferred operation is exposed by these tests.

## Required acceptance scenarios

| ID | Scenario | Expected result |
| --- | --- | --- |
| AUD-01 | Student requests their own provisional audit with one matching reviewed curriculum version | Student-scoped preview only; visible **PROVISIONAL — NOT AN OFFICIAL GRADUATION DECISION** label. |
| AUD-02 | Student requests another student's record or supplies a different student identifier | Denied without disclosing the other student's transcript or progress. |
| AUD-03 | Anonymous request to a protected audit endpoint | Authentication required; no academic data returned. |
| AUD-04 | No curriculum for student's programme and cohort | Unresolved; no graduation-pass determination. |
| AUD-05 | Two competing curriculum versions match the same programme/cohort | Ambiguity surfaced; fail closed, never select arbitrarily. |
| AUD-06 | Curriculum exists but remains `DRAFT` / unapproved | Results clearly provisional and not eligible for certification. |
| AUD-07 | Transcript has missing grade, unknown course equivalence, or disputed transfer credit | Data-quality issue reported; unresolved requirements are not counted as satisfied. |
| AUD-08 | Grade is below a required course threshold | Requirement not satisfied; no blanket override from aggregate GPA. |
| AUD-09 | Duplicate/retaken course appears in synthetic transcript | No accidental double counting; treatment deferred when policy is unknown. |
| AUD-10 | Invalid programme, cohort, or malformed identifier | Validation error; no database write or leaked internal error. |
| IMP-01 | Import preview with valid provenance | Deterministic dry-run result; no database writes. |
| IMP-02 | Import write without explicit authorization | Rejected without writing. |
| IMP-03 | Import write against missing or non-staging database path | Rejected without writing. |
| IMP-04 | Duplicate programme/track/version import | Rejected; existing record unchanged. |
| IMP-05 | Missing provenance, insecure source URL, or invalid workbook fingerprint | Rejected before write. |
| IMP-06 | Attempt to import `VERIFIED` curriculum | Rejected; importer cannot confer approval. |

## Evidence capture

For each case, retain the test identifier, sanitized fixture, expected/actual outcome, test command, timestamp, commit SHA, and CI URL. Never include passwords, connection strings, real transcripts, or student identifiers in public artifacts.

## Release boundary

Passing these scenarios is necessary but insufficient for production. Registry must separately approve programme rules, cohort applicability, transfer/retake policy, GPA scale, and graduation clearance. Until then, every displayed result remains provisional and non-authoritative.
