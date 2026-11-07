# Staging deployment checklist

The existing root `render.yaml` is a **static demo** and must not be represented as a live authenticated application. Do not enable real student records on the static demo.

## Prerequisites

- Create an isolated staging MongoDB database with synthetic records only.
- Provision a separate staging backend and frontend; do not deploy the protected `main` branch or merge Draft PR #2 until its checks and approvals are complete.
- Set `MONGODB_URI`, a strong `JWT_ACCESS_SECRET`, `CORS_ORIGINS` to the exact staging frontend origin, and `PORT` for the backend.
- Set `ENABLE_CURRICULUM_REVIEW=no` (or omit it). Never use `yes` before verified Registry authorization controls exist.
- Set frontend `NEXT_PUBLIC_API_BASE_URL` to the staging API's HTTPS origin. This value is embedded at build time.
- Use backend build `npm ci && npm run build` and start `npm start`; frontend build `npm ci && npm run build` and start `npm start`, from their respective `web-app` subdirectories.
- Verify `GET /health` reports 200 only after MongoDB connection is ready.
- Test student and administrator sign-in with synthetic accounts, scoped read-only endpoints, denied cross-role access, and review endpoint disabled response.
- Test no curriculum promotion, no official certification, and no private student data in logs.
- Verify secure HTTPS, secret handling, access restrictions, backups, monitoring, and rollback before sharing staging access.

**Not yet done:** No new Render service or staging database has been provisioned by this checklist. Integration testing and Registry governance sign-off are still required.
