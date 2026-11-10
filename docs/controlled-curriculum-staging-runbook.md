# Controlled curriculum draft import — staging runbook

This procedure is for **synthetic, isolated staging only**. It does not approve university rules, certify graduation, or authorize production writes.

## Before importing

1. Confirm the source workbook's owner, acquisition date, approved storage location, and SHA-256 fingerprint. Do not use unreviewed requirements as authoritative.
2. Prepare a JSON draft that passes `planCurriculumDraftImport` validation and retains source provenance. The draft must remain `DRAFT`, not `VERIFIED`.
3. Confirm the MongoDB connection string explicitly selects `/ashesi_graduation_staging`. The target must be an isolated staging cluster; a matching database name alone is not sufficient evidence of isolation.
4. Ensure the operator has approval to use synthetic staging records. Never print passwords, database credentials, or student data.

## Dry run (no writes)

From `web-app/backend`:

```sh
npx tsx scripts/import-curriculum-draft.ts ./draft.json
```

Inspect the JSON result for `accepted: true`, `mode: DRY_RUN`, expected programme/track/version, and the input file hash. A dry run validates the draft but does **not** establish database connectivity or academic approval.

## Controlled staging write

Only after verifying isolation, provenance, and the dry-run output, configure `MONGODB_URI` privately in the execution environment and run:

```sh
ALLOW_CURRICULUM_DRAFT_WRITE=yes npx tsx scripts/import-curriculum-draft.ts ./draft.json --write
```

The importer is create-only. It must reject duplicate programme/track/version records, mismatched database names, and missing explicit write approval. Never work around these guards to force an import.

## Evidence and rollback

Record the reviewed commit SHA, CI run URLs, source SHA-256, operator approval, staging environment identifier, programme/track/version, timestamp, and import outcome. Keep secrets out of logs. If a draft is wrong, stop; do not overwrite or promote it. Follow an authorized staging-data cleanup procedure and prepare a new version after review.

## Provisional degree-audit boundary

An audit based on imported drafts must prominently display **PROVISIONAL — NOT AN OFFICIAL GRADUATION DECISION**. Missing, disputed, or unapproved academic rules must produce an unresolved result, not a pass. Official certification requires a separate university-controlled approval process outside this importer.
