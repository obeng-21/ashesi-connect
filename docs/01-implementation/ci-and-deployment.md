# GitHub Actions and demonstration hosting

## Audit checks
`.github/workflows/audit-tests.yml` runs Vitest and TypeScript checks when the backend source changes. Check the [Actions tab](https://github.com/obeng-21/ashesi-connect/actions) for actual results. The workflow being committed does not mean a test run has passed.

## Static demo on GitHub Pages
`.github/workflows/pages.yml` is configured to publish `web-app/frontend/` using GitHub Pages. To enable it, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. After a successful deployment, the expected URL is `https://obeng-21.github.io/ashesi-connect/`. The link is not considered live until the deployment succeeds. If the repository is renamed, the expected Pages URL changes.

The static demo has no authentication and must only contain fictional records. Browser localStorage stores demo grade selections locally. The browser's Print / Save PDF option is not an official report.

## Next priorities
1. Obtain and parse the official `Degree_Audit_2028.xlsx` workbook.
2. Implement complete graduation-rule evaluation with versioned academic rules and tests.
3. Implement authenticated backend and database, then connect frontend and Flutter client.
4. Verify Figma click-through interactions and deploy the production stack separately.
