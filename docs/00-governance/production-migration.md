# Production migration

Target repository: obeng-21/ashesi-connect. This branch is a migration workstream and is not a production release.

The legacy browser-local demonstration must not be used as an authoritative graduation decision system. Replace its data flow with authenticated API calls backed by MongoDB and the validated, versioned 2028 workbook rules. Preserve the legacy UI until equivalent authenticated functionality passes tests.

## Release gates
1. Registry confirmation of course pass thresholds and disputed programme totals.
2. Secure authentication, student record isolation, audit trails and authorization tests.
3. End-to-end tests for web and mobile; migration and rollback tested.
4. Render environment configuration and MongoDB Atlas credentials provided securely.
5. Production smoke tests before traffic cutover.

Never seed real student information. Demo accounts and records must be removable without deleting live records.
