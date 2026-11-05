# Graduation Tracker — Iteration 2

## Implemented
- Responsive, standalone browser demonstration with dashboard, degree audit, editable sample grades, outstanding requirements, reports and admin preview.
- Ten programme selectors. **All ten currently use the same fictional course set** because official curriculum data has not been imported.
- Per-programme grade edits stored locally in the browser; reset control.
- Sample course-specific D+ and C thresholds, sample retake logic in the TypeScript engine.
- CSV export and browser Print / Save as PDF.
- Vitest unit tests for minimum grades, retakes, failure, in-progress and duplicate requirements.

## Run
- Open `web-app/frontend/index.html` in a browser (no server required).
- For engine tests: `cd web-app/backend && npm install && npm test`.

## Not implemented
- No official curriculum import from `Degree_Audit_2028.xlsx`.
- No backend API, MongoDB, user authentication, staff/student permissions, secure records or deployment.
- No Flutter app. No verified degree completion decisions.
- No complete rule coverage for elective categories, major minima, African Studies, LLB IAP, capstone or special track requirements.
- PDF output uses the browser print dialog, not a server-generated certified report.

**Data safety:** Only fictional course records should be entered in this prototype. Browser localStorage is not a secure academic records system.
