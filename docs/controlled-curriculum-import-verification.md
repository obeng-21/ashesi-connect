# Controlled curriculum import and provisional audit verification checklist

This checklist is for the **development preview**, not an authorization to publish an official curriculum or certify graduation.

## Import controls

1. Record the source workbook SHA-256 fingerprint, programme, cohort year, curriculum version, uploader identity, and import timestamp.
2. Run a dry-run structural validation before any write. Report missing programme sheets, duplicate course codes, invalid grades, non-finite credits, and inconsistent totals as blocking issues.
3. Require explicit authorized write intent for create-only draft imports. Reject duplicate version identifiers or fingerprints; never silently overwrite an existing curriculum.
4. Keep imported drafts separate from approved curriculum versions. Approval must be an independently authorized, audited Registry process.
5. Preserve the original source and validation report for reviewer reconciliation; do not infer policy from workbook layout.

## Provisional audit controls

1. Scope every transcript read to the authenticated student or explicitly authorized staff role.
2. Select a reviewed curriculum version only when programme and cohort match unambiguously; otherwise return insufficient data.
3. Reject malformed transcript attempts and unsupported grades; count repeated courses and overlapping electives without double credit.
4. Return outstanding requirements and explicit data-quality issues. Never convert a provisional result into a graduation certificate or official eligibility decision.
5. Test transfer credits, course equivalences, substitutions, repeat policies, and cohort changes against written academic rules before enabling a pilot.

## Evidence required before promoting the feature

- Passing CI for the exact candidate commit (audit engine, eligibility engine, production application).
- A reviewed workbook-to-rule reconciliation for each programme and cohort.
- Security tests for student isolation, staff authorization, and rejected unauthorized writes.
- An audit trail for curriculum drafts, reviewer decisions, and version changes.
- Written Registry approval for academic rules and a separate decision on official certification authority.

**Release gate:** A green CI run verifies software checks only. It does not approve curriculum interpretations, authorize production data imports, or confer graduation certification authority.
