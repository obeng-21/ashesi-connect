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

## Controlled-import acceptance scenarios (implementation backlog)

These are **required future tests**, not claims that the current implementation passes them.

| Scenario | Expected safe outcome | Evidence to capture |
| --- | --- | --- |
| Same workbook fingerprint imported twice for the same programme/cohort/version | Reject the second draft; leave the first draft unchanged | Request IDs, draft count, audit event |
| Same version identifier with a different workbook fingerprint | Reject conflict; require a new version and explicit review | Conflict response and unchanged stored fingerprint |
| Missing sheet or duplicate normalized course code | Block draft creation before any write | Validation report with sheet/row references |
| Invalid or unsupported grade, non-finite/negative credits, or inconsistent total | Return a blocking validation error; do not guess an academic rule | Sanitized fixture and failure assertion |
| Unauthorized user attempts import or approval | Deny access; create no curriculum or approval record | Authorization test and security audit event |
| Authorized dry run | Return a deterministic preview and source fingerprint; perform zero writes | Identical outputs across repeats and database write spy |
| Programme/cohort ambiguous or curriculum not reviewed | Return insufficient data; do not issue a provisional pass decision | Audit response and status assertion |
| Student requests another student's transcript | Deny read without leaking transcript data | Cross-student access test |
| Retake or overlapping elective | Apply reviewed repeat policy and count each eligible credit only once | Transcript fixture and credit reconciliation |
| Preview requested with incomplete academic policy mapping | Report unresolved rules and remain non-certifying | Outstanding-rule list and non-certification assertion |

### Reviewer sign-off record (template)

For each programme/cohort, capture the source fingerprint, curriculum version, mapping document revision, reviewer identity, review date, unresolved rule questions, decision, and evidence link. A review decision must not silently change a previously imported draft. No provisional preview should be represented as an official Registry decision.
