# Ashesi Graduation Tracker

> **Independent development prototype; not an official Ashesi University service.** No real student data or university systems are connected.

## Try the prototype

Open [the interactive dashboard](web-app/frontend/index.html) locally in a browser. It includes sample progress, editable demo grades, an outstanding-requirements view, CSV export, and browser print-to-PDF. The example records are fictional and **do not represent a complete programme audit**.

- [Figma design](https://www.figma.com/design/oEZD3Gm9qLxUgRZh1hY3nL)
- [Interactive 2028 prototype reference](web-app/frontend/degree-audit-2028-prototype.html)
- [Current implementation and limits](docs/01-implementation/iteration-2.md)
- [Master build prompt](docs/00-governance/master-build-prompt.md)
- [Workbook discrepancies](docs/00-governance/requirements-discrepancies.md)
- [Previous Ashesi Connect proposal, archived](docs/00-governance/previous-ashesi-connect-proposal.md)

## Development

```sh
cd web-app/backend
npm install
npm test
```

The TypeScript audit starter has focused unit tests. It **intentionally does not declare any student eligible for graduation**, even when all demo requirements are passed: the full rulebook is not implemented.

## Status

| Workstream | State |
|---|---|
| Responsive web demonstration | Implemented, fictional data |
| Course grades and report export | Implemented, browser-local only |
| Eligibility-engine unit tests | Added; not yet verified in CI |
| Figma low-fidelity screens | Available |
| High-fidelity clickable prototype | Incomplete |
| Official 2028 curriculum workbook ingestion | Blocked: source workbook missing |
| Backend API, database and login | Not implemented |
| Flutter app and Render deployment | Not implemented |

**Critical source needed:** `Degree_Audit_2028.xlsx` for validated curriculum requirements, including any C versus D+ course minima and discrepancies in printed programme credit totals.
