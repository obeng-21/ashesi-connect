# MASTER BUILD PROMPT: ASHESI GRADUATION TRACKER

Paste this entire prompt into an agentic coding environment (Claude Code recommended) with the file `Degree_Audit_2028.xlsx` placed in the working directory. Connect a Figma MCP server and a GitHub/Render-capable shell if available.

---

## 0. YOUR ROLE AND MISSION

You are a principal-level engineering team (product manager, UX/UI designer, mobile engineer, full-stack engineer, QA lead, DevOps engineer, technical writer) building a production-grade product end to end. Work autonomously. Do not stop to ask questions unless something is truly blocking; instead record every assumption in `docs/00-governance/assumptions-log.md` and keep going.

**Product:** Ashesi Graduation Tracker, a role-based system where students see whether they are eligible to graduate and exactly what remains, and administrators manage, monitor, report on and communicate about graduation eligibility for every student.

**Source of truth for graduation rules:** `Degree_Audit_2028.xlsx` (Ashesi University Degree Audit). Parse it programmatically; never hand-copy requirements from memory.

**Deliverables:**
1. A Git repository with exactly three top-level folders: `docs/`, `web-app/`, `mobile-app/` (plus root `README.md`, `.gitignore`, `.editorconfig`, `LICENSE`, `render.yaml`).
2. A fully working, tested, deployed web app (Next.js frontend and Node/Express backend on Render).
3. A fully working Flutter mobile app for Android and iOS.
4. A complete documentation set.
5. A Figma file with three pages (details in section 12).
6. In your final chat message, a ready-to-paste `.env` block (section 14).

---

## 1. QUALITY BAR AND ANTI-"AI-LOOK" RULES

All code must read as if written by a senior team: small cohesive modules, meaningful names, no dead code, no commented-out code, no placeholder `TODO`s left in main, typed everywhere (TypeScript strict on web/backend, Dart null-safety and `very_good_analysis`-level lints on mobile), consistent formatting (Prettier + ESLint, `dart format`), conventional commits, and a clean Git history organised by user story.

The UI must NOT look like a generic AI-generated dashboard. Forbidden: default purple/blue gradients, stock emoji as icons, uniform card grids with identical rounded boxes, lorem ipsum, generic hero blobs, unmodified component-library look. Required: a deliberate design language with strong typographic hierarchy, restrained colour, purposeful whitespace, considered motion, real data in every screen state, and polish comparable to Apple Music, Linear, Stripe Dashboard and Notion. Every screen needs designed loading (skeleton), empty, error and success states.

---

## 2. BRAND AND DESIGN SYSTEM

- **Brand:** Ashesi University. Use the official Ashesi logo (look it up from ashesi.edu.gh and store it under `web-app/frontend/public/brand/` and `mobile-app/assets/brand/`; if it cannot be downloaded, create a clearly labelled SVG placeholder and log it in assumptions so I can swap it).
- **Primary colours:** Ashesi maroon (use approximately `#8B1C3B`; verify against the official brand and log the exact value used), white, and warm neutral greys. Use a secondary accent sparingly. Define full light and dark themes.
- **Status colours (graduation severity):** Green `#1E9E5A`, Amber/Yellow `#E8A317`, Red `#D64545`. Colour must never be the only signal: every indicator also carries an icon and a text label (accessibility, WCAG 2.2 AA).
- **Typography:** one expressive display face plus one highly legible UI face (e.g., a refined serif or geometric display for headings and Inter or similar for UI). Define a type scale and spacing scale as design tokens shared by web (CSS variables/Tailwind config) and mobile (Dart `ThemeExtension`).
- **Web:** responsive and consistent from 320px phones to 4K desktops, with a considered layout at each breakpoint (not just stacked columns). Collapsible sidebar on desktop, bottom navigation or drawer on small screens. Keyboard accessible, focus-visible styles, `prefers-reduced-motion` respected.
- **Mobile:** take inspiration from modern iOS design (liquid-glass style translucency, layered blur, soft depth, large titles, fluid spring animations, haptics), but keep contrast and readability intact. Use adaptive widgets so the app feels native on both Android and iOS. Implement a large-title collapsing header, a floating glass tab bar, and a sheet-based detail pattern.
- **Signature moments:** an animated graduation-progress ring on the student home screen, a "path to graduation" timeline, and a satisfying confetti-free but elegant celebration state when a student becomes eligible.

---

## 3. DOMAIN MODEL AND RULES ENGINE

### 3.1 Programmes (one per sheet in the workbook)
`BA` Business Administration, `ECON` Economics, `LLB` Law, `MIS` Management Information Systems, `CS` Computer Science, `CE` Computer Engineering, `EE` Electrical and Electronic Engineering, `ME` Mechanical Engineering, `MT` Mechatronics Engineering, `BE` Biological Engineering.

### 3.2 Structure of each audit (parse this from the workbook)
Each programme has the same skeleton:
- **Liberal Arts & Sciences Core:** Humanities & Social Sciences (Written and Oral Comm., Text and Meaning, Ashesi Seminar & Leadership 1/2/3 at 0.5 credit each, Leadership 4, programme-specific economics courses); Business (Foundations of Design & Entrepreneurship I and II, and in some programmes a finance course); Mathematics & Quantitative; Computing; Science (where applicable); Research / Project Prep; Non-Major Electives (including at least 1 African Studies course).
- **Major:** Required Major Classes, Major Electives, Capstone (Capstone 1 may count as an elective in BA, MIS and CS; engineering programmes have a single 1-credit Capstone).
- **IAP (LLB only):** Legal Reasoning, Language for Law, Advanced Language for Law, Advanced Legal Writing.
- Courses marked `*` are 0.5 credit.

### 3.3 Credit requirements printed in the workbook
| Programme | Total credits | Alternate track total |
|---|---|---|
| BA | 34.5 | 35.5 (Pre-Calc track) |
| ECON | 35.5 | 36.5 (Pre-Calc track) |
| LLB | 40.5 | none |
| MIS | 33.5 | 34.5 (Pre-Calc track) |
| CS | 34.5 | 35.5 (Pre-Calc track) |
| CE | 37 | 38 (Calc 1 and 2 track) |
| EE | 37 | 38 (Calc 1 and 2 track) |
| ME | 37 | 38 (Calc 1 and 2 track) |
| MT | 38 | 39 (Calc 1 and 2 track) |
| BE | 37 | 38 (Calc 1 and 2 track) |

**Important:** Build a workbook-ingestion script (`web-app/backend/scripts/ingest-degree-audit.ts`) that extracts every category, course, credit value and printed total into a normalised `ProgrammeRequirement` collection. The script must recompute each category and overall total from its components and compare against the printed totals. Log every discrepancy to `docs/00-governance/requirements-discrepancies.md` and make the engine use the component sums as the working rule with an admin-configurable override. Known suspects to verify: the CS sheet (Liberal Arts core printed as 17.5 but components appear to sum to 16.5, overall printed as 34.5) and the ME sheet (major total printed as 18 while the overall of 37 implies 19). Do not silently pick a number; surface it.

### 3.4 Grades and pass rules
- Grade scale present in the workbook: `A+, A, B+, B, C+, C, D+, D, E`. Store grade points in a configurable table (default: A+ 4.0 through E 0.0; confirm against Ashesi policy and log the choice). Also support non-letter statuses: `Enrolled` (in progress), `Not Yet Completed`, `N/A`, and `Incomplete`.
- **Minimum passing grade is per course**: each course in the catalogue has a `minPassingGrade` field, either `D+` or `C`. Default to `D+`. Provide a seed file `catalogue-pass-thresholds.json` and an admin UI to edit thresholds, with an audit trail. Mark in assumptions which courses you assigned `C` and why (e.g., major-specific core and capstone courses are common candidates), and make it obvious that the registry must confirm this list.
- A graded course shows **PASS** if grade is at or above its course threshold, otherwise **FAILED**. Enrolled courses show **IN PROGRESS** with no grade. A failed required course must be retaken; show it as outstanding.
- A retake replaces the failed attempt for requirement purposes while history of all attempts is preserved and visible.

### 3.5 Eligibility engine (pure, deterministic, heavily unit-tested)
Implement as a standalone, framework-free TypeScript package inside the backend (`src/domain/eligibility/`). Inputs: a student's programme, track, and course records. Outputs: a full audit result. A student is **ELIGIBLE** only when ALL of these hold:
1. Every required course in every category is completed with a passing grade (per-course threshold).
2. Each category's credit minimum is met (including elective counts, at least 1 African Studies elective, and the correct maths track credits).
3. Total credits meet the programme total for the student's track.
4. Capstone requirement(s) completed and passed.
5. LLB students: all IAP courses completed.
6. No course is outstanding, failed-unresolved or still in progress.

Return: `eligible: boolean`, `creditsEarned`, `creditsRequired`, `creditsInProgress`, `percentComplete`, per-category breakdown, `remainingRequirements[]` (each with course or elective slot, credits, reason such as NOT_TAKEN, FAILED, IN_PROGRESS, ELECTIVE_SLOT_OPEN, AFRICAN_STUDIES_MISSING), and `severity`.

### 3.6 Severity indicators (admin view, also shown to students as "standing")
- **GREEN, On track / Eligible:** eligible, or all remaining requirements are currently in progress and projected to complete.
- **YELLOW, At risk:** requirements remain that can still be completed within the remaining semesters, or a failed course needs a retake, or credits shortfall is small.
- **RED, Critical:** not enough remaining semesters to complete required credits, multiple failed core courses, capstone at risk, or credit shortfall beyond what one semester can absorb.
Make the thresholds configurable (`severity-config.json` plus admin settings screen). Document the exact rules in `docs/03-design/severity-model.md`. (Note: your brief listed "red, yellow and red"; this system implements red, yellow and green.)

---

## 4. ROLES, AUTHENTICATION AND AUTHORISATION

- **Student login:** Student ID + password. **Admin login:** Staff ID + password. A single login screen with one credential field that is validated and resolved server-side: the backend determines the role from the matched account record (never from a client-supplied role), issues tokens, and the client renders only the features that role is permitted to see.
- ID format: make student and staff ID patterns configurable (regex in config); seed realistic samples (e.g., 8-digit student IDs, `STF-` prefixed staff IDs) and log them.
- Passwords hashed with Argon2id; short-lived JWT access tokens (15 min) with rotating refresh tokens in httpOnly, Secure, SameSite cookies on web and secure storage on mobile; account lockout and rate limiting; forced password change on first login; password reset via admin-triggered flow.
- RBAC implemented as policy-based middleware (`requirePermission('student:read:any')`), with permission sets per role. Students can only ever read their own record (enforced at the query layer, not just the route). Include a permission matrix document and automated tests proving that a student token cannot reach any admin route or another student's data (IDOR tests).
- Roles to support from day one: `STUDENT`, `ADMIN`; design the model so `SUPER_ADMIN` and `ADVISOR` can be added without schema changes.
- Full audit log of admin actions (who viewed, edited or exported what, and when).

---

## 5. STUDENT FEATURES (web and mobile)

1. **Home / Status:** large graduation status card (ELIGIBLE / NOT YET ELIGIBLE with severity colour, icon and text), animated progress ring (credits earned of required), credits in progress, expected graduation term, and top three next actions.
2. **My Requirements:** the full requirement tree for their programme and track, grouped by category, each item with state (Completed, In Progress, Remaining, Failed) and credits. Expand/collapse, search, and filter by state.
3. **What's Remaining:** a focused list of everything left to graduate, with reasons, credits, and suggested semester placement.
4. **My Courses:** every course enrolled or completed, by year and semester, with exact grade for graded courses, credits, and a clear PASS / FAILED / IN PROGRESS badge according to that course's minimum passing grade. Show attempts history for retakes.
5. **Inbox / Notifications:** messages from administration, unread badge, read/unread state, mark all read, and push notifications on mobile.
6. **Profile and security:** change password, view programme, year group, track.
7. Students never see other students' data or any aggregate analytics.

---

## 6. ADMINISTRATOR FEATURES (web primary; mobile gets a streamlined admin experience)

1. **Student search by ID:** instant, typo-tolerant search with recent searches. Opens a full student profile.
2. **Student profile (admin):** identity and programme, severity badge (red/yellow/green), full audit breakdown identical to the student's but with extra detail, all courses and attempts and grades, credit maths, notes, message history, and an "export PDF audit" action.
3. **Eligibility register:** a filterable, sortable, paginated table of all students with colour-coded severity chips; filters by programme, year group, severity, eligibility, credits remaining; bulk select to message.
4. **Data management:** import students, courses and grades via CSV/XLSX with validation preview, error report and rollback; manual create/edit of students and course records; course catalogue management including per-course minimum passing grade; programme requirement versions (e.g., audit 2028) with effective dates.
5. **Reports and Statistics section (see section 7).**
6. **Messaging centre (see section 8).**
7. **Settings:** severity thresholds, grade scale, ID patterns, academic calendar, user management (create admins, reset passwords), audit log viewer.

---

## 7. REPORTS AND STATISTICS (generate in-app, print, export)

Every report supports filters (year, programme, year group), on-screen charts, a print-optimised stylesheet, **Print** and **Download PDF**, plus CSV export. Reports include:
- Graduation rate for a selected year (graduated / eligible cohort).
- Non-graduation rate for a selected year with breakdown of reasons (failed core course, credit shortfall, missing capstone, missing African Studies elective, etc.).
- Courses with the highest and lowest pass/graduation-contribution rates; courses most often failed or retaken.
- Year-on-year comparison (select two or more years; side-by-side and trend lines).
- Programme comparison (graduation rate, average credits, severity distribution per programme).
- Current severity distribution (counts of red / yellow / green) and at-risk lists.
- Cohort progress (percent complete by year group).
- Credits-remaining distribution and projected graduation by term.
- Grade distribution per course.
- Messaging reach report (sent, delivered, read rates).
Charts: use a high-quality library (Recharts or ECharts on web; `fl_chart` on mobile), styled to the design system. Reports must be generated by backend aggregation pipelines (MongoDB aggregation) with indexes and caching, not computed in the browser.

---

## 8. MESSAGING AND NOTIFICATIONS

- Admin composes messages (title, rich-text body, priority, optional attachments, schedule for later), and targets: all users, all students, a programme, a year group, a severity band (e.g., all RED students), or individual IDs.
- Templates for reminders (e.g., "Graduation audit review due", "Missing African Studies elective").
- Recipients get an in-app inbox with unread badges and real-time delivery (Socket.IO or SSE), plus push notifications on mobile (Firebase Cloud Messaging; wire it fully, and document the Firebase setup; if credentials are unavailable keep the code path behind a feature flag).
- Delivery and read receipts visible to admin per message.

---

## 9. ARCHITECTURE AND REPOSITORY LAYOUT

```
/ (repo root)
├── README.md
├── render.yaml
├── docs/
├── web-app/
│   ├── backend/        Node.js + Express + TypeScript + MongoDB (Mongoose)
│   └── frontend/       Next.js (App Router) + TypeScript + Tailwind + shadcn/ui primitives, heavily customised
└── mobile-app/         Flutter + Dart (Riverpod, go_router, dio, freezed, secure storage)
```

**Backend:** layered architecture (routes, controllers, services, repositories, domain), Zod request validation, centralised error handling, structured logging (pino), OpenAPI 3.1 spec generated and served at `/api/docs`, versioned API `/api/v1`, helmet, CORS allow-list, rate limiting, mongo-sanitize, request IDs, health endpoint `/health`, graceful shutdown. MongoDB collections: `users`, `students`, `programmes`, `programmeRequirements`, `courses`, `enrollments` (with attempts), `messages`, `messageReceipts`, `auditLogs`, `reportSnapshots`, `settings`. Add proper indexes (studentId unique, programme+yearGroup, severity).

**Frontend:** server components where sensible, typed API client generated from the OpenAPI spec, TanStack Query, role-guarded route groups `(student)` and `(admin)`, middleware that redirects by role, print stylesheets for reports.

**Mobile:** feature-first folder structure, shared design tokens, offline-friendly cache of the last audit result, biometric unlock option, deep links from push notifications.

**Seed data:** a seed script generating at least 600 realistic students across all 10 programmes, multiple year groups (including several graduating classes for year-over-year reports), realistic grade distributions, failed courses, retakes, and a spread of green/yellow/red outcomes. Include documented demo accounts for one student and one admin.

---

## 10. TESTING

- Unit tests for the eligibility engine covering every programme, both tracks, failed and retaken courses, per-course thresholds (D+ vs C), African Studies rule, LLB IAP, and edge cases (target 95%+ coverage on the engine).
- API integration tests (Supertest + in-memory MongoDB) including RBAC and IDOR tests.
- Frontend component tests (Vitest + Testing Library) and end-to-end tests (Playwright) for the main student and admin journeys at mobile, tablet and desktop viewports.
- Flutter widget and integration tests.
- CI via GitHub Actions: lint, type-check, test, build for web and mobile on every PR.
- Accessibility checks (axe) and Lighthouse budgets (performance, accessibility 95+).

---

## 11. DOCUMENTATION (`docs/`)

Create these subfolders, each populated with real content (no empty stubs):

```
docs/
├── 00-governance/        team-charter.md, working-agreement.md, definition-of-done.md, risk-register.md, assumptions-log.md, requirements-discrepancies.md, raci.md
├── 01-discovery/         problem-statement.md, stakeholder-analysis.md, personas.md, user-journeys.md, competitive-review.md
├── 02-requirements/      prd.md, user-stories.md, acceptance-criteria.md, non-functional-requirements.md, rbac-permission-matrix.md, degree-audit-rules.md
├── 03-design/            design-system.md, information-architecture.md, severity-model.md, ux-principles.md, figma-links.md
├── 04-architecture/      system-architecture.md, c4-diagrams (mermaid), data-model.md, adr/ (architecture decision records), security-and-privacy.md
├── 05-api/               api-contract.md, openapi.yaml, postman-collection.json, error-catalogue.md
├── 06-sprints/           sprint-00-plan … sprint-NN/ each with backlog.md, sprint-plan.md, daily-notes.md, sprint-review.md, retrospective.md
├── 07-testing/           test-strategy.md, test-plan.md, test-reports/, uat-script.md
├── 08-deployment/        render-deployment-guide.md, environment-variables.md, mobile-release-guide.md, runbook.md, rollback-plan.md
├── 09-handoff/           final-handoff.md, admin-user-guide.md, student-user-guide.md, maintenance-guide.md, known-issues.md, future-roadmap.md
└── 10-presentation/      project-summary.md, demo-script.md
```

**Sprint organisation rule:** group all work into sprints by user story and label every story exactly `US-{number}: {short title}` (for example `US-01: Secure login by Student or Staff ID`, `US-02: View graduation eligibility status`, `US-03: View requirements for my programme`, `US-04: View remaining requirements`, `US-05: View courses and grades with pass/fail`, `US-06: Search student by ID`, `US-07: Colour-coded severity register`, `US-08: Graduation rate reports`, `US-09: Compare years`, `US-10: Print and export reports`, `US-11: Send reminders and notifications`, `US-12: Inbox and push notifications`, and so on; derive the full list, with 30 or more stories, from this prompt). Each story has acceptance criteria, story points, owner role, and a Git branch/commit prefix `US-xx`. Every sprint folder contains its review with demo notes, metrics (planned vs completed points) and retrospective actions. Write the documents as the work happens, not at the end.

---

## 12. FIGMA FILE (three pages)

Using the Figma MCP/API, create a Figma file named **Ashesi Graduation Tracker** with:
1. **Page 1, Low-Fidelity Wireframes:** greyscale wireframes for every screen of student and admin on web (desktop and mobile breakpoints) and mobile app, with annotations for key interactions.
2. **Page 2, High-Fidelity Wireframes and Prototype:** full-colour, design-system-accurate screens using Figma variables (colour, type, spacing), reusable components with variants (buttons, status chips, progress ring, requirement rows, tables, inputs, tabs, sheets), auto-layout throughout, light and dark. Fully linked prototype flows with smart-animate transitions covering at least: login (student and admin), student home to requirements to remaining to courses, inbox, admin search to student profile, severity register filtering, report generation, print preview, compose and send message, and settings. Name flows clearly (e.g., "Flow: Student checks graduation status").
3. **Page 3, Presentation Slides:** a 16:9 deck on the whole project (problem, users, solution, architecture, design language, key flows, reports, security, delivery process and sprints, deployment, results, roadmap).
If the Figma tools are unavailable in your environment, produce the same design as high-fidelity HTML/SVG exports plus a detailed `docs/03-design/figma-build-spec.md` and tell me clearly in the final message that the Figma file could not be created programmatically.

---

## 13. WEB DEPLOYMENT ON RENDER

- **Frontend:** Render **Static Site** (Next.js static export where possible; if any feature requires SSR, restructure so the frontend is a fully static export calling the API, because static hosting is required). Configure SPA rewrites, security headers, and cache headers in `render.yaml`.
- **Backend:** Render **Web Service** (Node), health check `/health`, auto-deploy from `main`, build and start commands defined, CORS allow-list set to the static site URL.
- **Database:** MongoDB Atlas (free tier is acceptable). Never commit secrets.
- Provide `render.yaml` as a Blueprint, and `docs/08-deployment/render-deployment-guide.md` with click-by-click steps. Execute the deployment yourself if you have Render credentials/CLI; otherwise prepare everything so it is a one-click Blueprint deploy and tell me exactly what to do.
- Run a post-deploy smoke test (login, status fetch, admin search, report generation) and record results in `docs/07-testing/test-reports/`.

---

## 14. ENVIRONMENT VARIABLES (MUST BE GIVEN TO ME IN CHAT)

Create `.env.example` files for backend, frontend and mobile, then in your **final chat message** output complete, copy-ready `.env` blocks with real generated values for everything you can generate (JWT secrets, refresh secrets, cookie secret, seed admin password, encryption keys via a cryptographically secure generator), and clearly marked `<FILL_ME>` placeholders only for things that only I can supply (MongoDB Atlas connection string, Firebase credentials, SMTP credentials, final Render URLs). Include at minimum:

Backend: `NODE_ENV, PORT, MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL, COOKIE_SECRET, CORS_ORIGINS, STUDENT_ID_REGEX, STAFF_ID_REGEX, SEED_ADMIN_STAFF_ID, SEED_ADMIN_PASSWORD, FCM_SERVICE_ACCOUNT_JSON, SMTP_HOST, SMTP_USER, SMTP_PASS, LOG_LEVEL`.
Frontend: `NEXT_PUBLIC_API_BASE_URL, NEXT_PUBLIC_APP_NAME`.
Mobile: `API_BASE_URL` (via `--dart-define`), Firebase config files.
Also list exactly which variables to paste into which Render service dashboard.

---

## 15. EXECUTION PLAN

1. Initialise repo, governance docs, and assumptions log. Parse the workbook and generate the discrepancy report.
2. Design system and Figma (pages 1 and 2) in parallel with backend foundations.
3. Build in sprints by user story: auth and RBAC, rules engine, student experience, admin experience, reports, messaging, mobile, hardening.
4. Write tests with each story, keep CI green, and update docs and sprint reviews each sprint.
5. Deploy to Render, smoke test, finalise Figma page 3 and handoff docs.
6. Make small, conventional commits (`feat(US-06): …`) so the history tells the story.

**Definition of done:** all stories accepted, tests and CI green, no critical accessibility or security findings, web deployed and reachable from phone, tablet and desktop, mobile app builds for Android (APK/AAB) and iOS (documented), docs complete, Figma complete.

## 16. FINAL RESPONSE FORMAT

When finished, reply with: (a) a summary of what was built, (b) live URLs, (c) demo credentials, (d) the full `.env` blocks from section 14, (e) the list of assumptions and workbook discrepancies needing registry confirmation, especially the per-course minimum passing grades (D+ vs C) and the CS and ME total mismatches, and (f) anything that could not be completed and why.