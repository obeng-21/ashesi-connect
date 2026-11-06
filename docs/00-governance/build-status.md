# Implementation status — 2026-11-06

This branch is under active development and MUST NOT be deployed as a university production service.

## Implemented in branch
- MongoDB connection lifecycle, health endpoint and basic collections for students, enrollment attempts and programme requirements.
- Password verification with Argon2 and a signed, short-lived JWT access token.
- Role-restricted student self-record and admin student search endpoints.
- Static-export Next.js login interface.

## Blocking work
- Auth refresh token rotation, secure cookie handling, password change and reset, login rate limiting, admin activity logging and complete permission tests.
- Verified workbook ingestion, curriculum versioning, elective and track rules, and all eligibility cases.
- Student and administrator screens, reports, imports, messaging, PDF exports, mobile app, CI and deployment.
- Registry confirmation of course-specific grade thresholds and discrepancies.

## Release policy
Never label this code production-ready until automated tests and security reviews pass, verified academic rules are loaded, and the full application is deployed and smoke-tested.
