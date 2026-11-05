# US-02: Evaluate graduation eligibility — Sprint 01

## Implemented in this iteration

- Framework-independent TypeScript audit evaluator with D+ and C course thresholds
- Failed-course retake handling and transcript attempt preservation
- Elective credit and count requirements, plus African Studies requirement
- In-progress course tracking, category credits and outstanding reasons
- Deterministic test cases for the above behaviour

## Limitations and next acceptance gates

- No verified `Degree_Audit_2028.xlsx` ingestion, so no programme-specific curriculum data has been seeded.
- Elective course thresholds are provisionally D+; catalogue-specific thresholds must be loaded before production use.
- Overall total credits in this evaluator count recognized required/elective course credits only; the complete university rules engine must resolve category overlaps, optional tracks, capstone variants, LLB IAP and repeated course policies with verified workbook inputs.
- The evaluator is a library, not an authenticated API. There is no production student login, admin portal, MongoDB, or Render deployment.
- Tests are included but need to be run in CI and against the complete verified catalogue.

## Run locally

From `web-app/backend` after installing Node.js and TypeScript tooling:

```bash
npm install --save-dev typescript @types/node
npm test
```

Do not use the output for real student graduation decisions.
