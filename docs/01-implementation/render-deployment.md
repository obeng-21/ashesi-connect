# Render deployment

The previous GitHub Pages workflow was retired after GitHub denied the Pages enablement API. The web demo is now configured for Render using the repository-root `render.yaml`.

## Deploy

1. Connect the Render app to your account (or sign in at https://dashboard.render.com).
2. Create a **Blueprint** from GitHub repository `obeng-21/ashesi-connect` and branch `main`, using `render.yaml`.
3. Review the service `ashesi-graduation-tracker-demo` and approve the deployment.
4. Wait for the Render service status to become **Live**, then open the exact URL shown in the Render dashboard.

If deploying manually as a **Static Site** instead of Blueprint:
- Repository: `obeng-21/ashesi-connect`
- Branch: `main`
- Build command: `echo "Publishing static Ashesi Graduation Tracker demo"`
- Publish directory: `web-app/frontend`

No build dependencies, environment variables, or server start command are needed for this standalone HTML demo. Do not deploy the TypeScript eligibility module as a web server: it currently has no HTTP listener.

## Scope and safety
- The published dashboard uses **fictional records** only.
- Edited grades are saved to browser localStorage, not a secure database.
- CSV export and browser Print / Save PDF are demonstration features.
- Real student records, role-based access control, official graduation rules, and backend APIs are **not implemented**.
- No live Render URL can be confirmed until a Render service is actually created and deployed.

## Verification checklist
- Render service status shows Live.
- Root URL loads the dashboard.
- My courses grades update progress.
- Remaining requirements reflect failed and incomplete courses.
- CSV export downloads a file.
- Print / Save PDF opens the browser print dialog.
