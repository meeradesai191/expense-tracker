# 💰 Expense Tracker
### MCA Sem 4 Seminar — DevOps Automation Demo (Node.js)

An Expense Tracker app used to demonstrate a **complete, automated DevOps
pipeline**: Git → GitHub Actions (lint + test) → Docker (build) → Docker Hub
(registry) → Render (live deploy).

**Pages:** `/` Home · `/expenses` add/view expenses · `/dashboard` live build info + spend-by-category chart · `/about` pipeline explanation

---

## 1. Run locally

```bash
npm install
npm start
```
Open **http://localhost:3000**

Run the automated test suite:
```bash
npm test
```
Run the linter:
```bash
npm run lint
```

## 2. Run with Docker

```bash
docker build -t expense-tracker .
docker run -p 3000:3000 expense-tracker
```
or with Docker Compose:
```bash
docker compose up --build
```

---

## 3. Push this project to GitHub

```bash
git init
git add .
git commit -m "DevOps automation demo - expense tracker"
git branch -M main
git remote add origin https://github.com/<your-username>/expense-tracker.git
git push -u origin main
```

## 4. Enable the live CI/CD pipeline

The pipeline (`.github/workflows/ci.yml`) needs three **repository secrets**
(GitHub repo → Settings → Secrets and variables → Actions → New repository secret):

| Secret name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | your Docker Hub username |
| `DOCKERHUB_TOKEN` | a Docker Hub access token (Docker Hub → Account Settings → Security) |
| `RENDER_DEPLOY_HOOK_URL` | deploy hook URL from your Render service (see below) |

Once these are set, **every `git push` to `main`** automatically: lints → tests
→ builds a Docker image tagged with the commit hash → pushes it to Docker Hub
→ tells Render to redeploy. Nothing is done by hand.

## 5. Put it on a live server (Render — free tier)

1. Go to https://render.com → sign up/log in with GitHub.
2. **New → Web Service** → connect this GitHub repo.
3. Runtime: **Docker** (Render detects the `Dockerfile` automatically).
4. Instance type: Free.
5. Create the service — Render builds and deploys it, giving you a public URL
   like `https://expense-tracker.onrender.com`.
6. In the Render service → **Settings → Deploy Hook**, copy the URL and save
   it as the `RENDER_DEPLOY_HOOK_URL` GitHub secret above — that's what lets
   GitHub Actions trigger a redeploy automatically after every push.

That public URL is what you present live in your seminar — open `/dashboard`
on it to show the exact commit and build time currently running, proving the
pipeline actually deployed your latest push.

---

## Project structure
```
expense-tracker/
 ├── src/
 │   ├── app.js              # Express server, page routes, /health, /api/meta
 │   ├── routes/expenses.js  # Expense CRUD + summary API
 │   └── models/expense.js   # In-memory data model
 ├── tests/app.test.js       # Jest + Supertest automated tests (10 tests)
 ├── public/                 # home.html, expenses.html, dashboard.html, about.html, style.css
 ├── Dockerfile               # Multi-stage build, non-root user, healthcheck
 ├── docker-compose.yml        # One-command local run
 ├── .eslintrc.json            # Lint rules
 └── .github/workflows/ci.yml  # Lint → Test → Build & push → Deploy
```

## Tech stack
| Tool | Purpose |
|------|---------|
| Node.js + Express | Backend + page serving |
| Jest + Supertest | Automated testing |
| ESLint | Automated linting |
| Docker (multi-stage) | Containerization |
| GitHub Actions | CI/CD pipeline |
| Docker Hub | Container registry |
| Render | Live hosting / continuous deployment |
