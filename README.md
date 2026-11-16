# Academic Nexus

Academic Nexus is a role-based school-planning demo for principals, teachers, and families. It includes curriculum approvals and pacing, lesson progress, rubric grading, student support flags, family messages, and upcoming checkpoints.

## Run locally

Requirements: Node.js 22.12 or newer and PostgreSQL 17.

1. Install PostgreSQL 17 or newer and install its command-line tools.
2. Install app dependencies with `npm install`.
3. Initialize an isolated local database with `npm run setup:db`. The script creates a PostgreSQL cluster under your local app-data folder, writes its connection string to the ignored `.env` file, and generates a shared demo password and session-signing secret there. To see the generated demo password locally, run `(Get-Content .env | Where-Object { $_ -like 'DEMO_PASSWORD=*' }) -replace '^DEMO_PASSWORD=', ''`.
4. Start the API and web app with `npm run dev`.
5. Open <http://localhost:3000>.

The API creates the database table on startup and seeds a demo workspace on first use. Demo routes require the shared password; the server issues an HttpOnly, SameSite session cookie and binds it to a random workspace ID stored in this browser profile. Separate browser profiles get separate demo workspaces; the shared password does not create individual accounts or sync data across devices.

Use the **Reset Term Data** action to restore the current browser's sample workspace. The sample records are fictional. Do not enter real student or school data: the demo has one shared password, not individual accounts, and its role switcher is for demonstration only.

## Local services

- Web app: <http://localhost:3000>
- API health check: <http://localhost:3001/api/health>
- PostgreSQL: `127.0.0.1:5433` (local Academic Nexus cluster)

The shared demo password is a lightweight preview gate, not individual identity or production-grade school security. Use only fictional data. Before public hosting, set `DEMO_PASSWORD` and `SESSION_SECRET` as server-side secrets, require HTTPS, configure a production database and backups, and add monitoring. Do not commit `.env` or expose its generated password. No public app deployment has been made.
