# Ashesi Graduation Tracker

> **Development prototype — not affiliated with or approved by Ashesi University.** No real student data, official enrolment records or institutional authentication are connected.

A student and administrator graduation audit project based on the [Ashesi Graduation Tracker Master Build Prompt](docs/00-governance/master-build-prompt.md). This repository is being repurposed from the earlier Ashesi Connect communications proposal, which is preserved in [the archive](docs/00-governance/previous-ashesi-connect-proposal.md).

## Quick access

- **Figma design and wireframes:** [Ashesi Graduation Tracker](https://www.figma.com/design/oEZD3Gm9qLxUgRZh1hY3nL)
- **Graduation Tracker demonstration:** [web-app/frontend/index.html](web-app/frontend/index.html) — download or open locally in a browser
- **Earlier interactive 2028 degree audit prototype:** [web-app/frontend/degree-audit-2028-prototype.html](web-app/frontend/degree-audit-2028-prototype.html) — reference only, course and grade assumptions must be checked
- **Eligibility engine starter:** [web-app/backend/src/domain/eligibility/engine.ts](web-app/backend/src/domain/eligibility/engine.ts)
- **Workbook discrepancies:** [docs/00-governance/requirements-discrepancies.md](docs/00-governance/requirements-discrepancies.md)

## Current build status

| Feature | Status |
|---|---|
| Figma project | Created; low-fidelity student/admin wireframes present |
| Browser demo | Basic static page with example records, CSV download and print-to-PDF |
| Eligibility engine | TypeScript grade/retake algorithm starter only |
| Workbook ingestion | Blocked: `Degree_Audit_2028.xlsx` is not in the current source set |
| Backend API, database, login and reports | Not implemented |
| Flutter Android/iOS app | Not implemented |
| Render hosting | Not deployed |

The example course records are illustrative and *not* a complete course catalogue. A course-level default passing threshold of D+ is provisional. Some courses may require C once confirmed by the university registry. No prototype output constitutes an official graduation eligibility finding.

## Open the static demonstration

Open `web-app/frontend/index.html` in any modern browser. It requires no build tools. You can inspect the example student audit, download an illustrative CSV report or print/save it as a PDF through your browser. Admin is a placeholder, not a secure admin area.

## Planned architecture

```text
docs/                Discovery, audit assumptions, governance and design links
web-app/frontend/    Browser prototype; future Next.js application
web-app/backend/     Future Express API and eligibility engine
mobile-app/          Future Flutter application
render.yaml          Render blueprint placeholder
```

### Graduation eligibility controls to implement

- Per-course passing grade; retakes; category credit minimums
- Maths track and total credits, non-major electives, African Studies
- Capstone, LLB IAP requirements and outstanding courses
- Student ID and Staff ID login, backend authorization, audit logs
- Student requirements and courses, admin register, reporting and messaging

## Academic rule verification

The master specification cites possible discrepancies in the Computer Science core and Mechanical Engineering major totals. They are **unverified** until the original Excel workbook is parsed. This repository intentionally does not include real student records, passwords, tokens or production credentials.

## Repository and Figma linking

The live Figma workspace is linked above. A GitHub repository is not automatically synchronized with Figma canvas edits; design changes and implementation code require separate commits or integrations.

## Implementation notes

See [assumptions](docs/00-governance/assumptions-log.md), [Figma links](docs/03-design/figma-links.md), and the [master prompt](docs/00-governance/master-build-prompt.md).
