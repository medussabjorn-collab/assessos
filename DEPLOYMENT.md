# LeaderAssess Pro — Production Deployment Guide

> **Stack**: GitHub → GitHub Actions CI/CD → Render.com (backend + frontend + PostgreSQL + Redis) + MongoDB Atlas

---

## 1. Prerequisites

| Requirement | Notes |
|---|---|
| GitHub account | Repository for both frontend and backend |
| Render.com account | Free tier works; Starter plan for always-on |
| MongoDB Atlas account | Free M0 cluster (512MB) sufficient for dev |
| Resend account (optional) | Free tier: 3,000 emails/month |
| Judge0 / RapidAPI (optional) | For live code execution |

---

## 2. MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → **New Project** → **Build a Database**
2. Choose **M0 Free** → select region closest to your Render region (Oregon = `us-west-2`)
3. Create a database user: `leaderassess` / `<strong-password>`
4. Network Access → **Allow Access from Anywhere** (`0.0.0.0/0`) — required for Render
5. Click **Connect** → **Drivers** → copy the connection string:
   ```
   mongodb+srv://leaderassess:<password>@cluster0.xxxxx.mongodb.net/leaderassess?retryWrites=true&w=majority
   ```
6. Save this as `MONGODB_URI` — you'll need it in Render dashboard

---

## 3. GitHub Repositories

Push both projects to GitHub:

```bash
# Backend
cd leadership-assessment-backend
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/YOUR_USERNAME/leaderassess-backend.git
git push -u origin main

# Frontend
cd ../leadership-assessment
git init
git add .
git commit -m "Initial frontend"
git remote add origin https://github.com/YOUR_USERNAME/leaderassess-frontend.git
git push -u origin main
```

---

## 4. Render Blueprint Deploy

### Backend
1. Render Dashboard → **New** → **Blueprint**
2. Connect your `leaderassess-backend` GitHub repo
3. Render detects `render.yaml` automatically
4. Click **Apply** — this creates:
   - Web service `leaderassess-api`
   - PostgreSQL database `leaderassess-postgres`
   - Redis instance `leaderassess-redis`

### Frontend
1. Render Dashboard → **New** → **Blueprint**
2. Connect your `leaderassess-frontend` GitHub repo
3. Click **Apply** — creates static site `leaderassess-frontend`

---

## 5. Render Environment Variables

After deploy, set these in **Render Dashboard → your service → Environment**:

### Backend (`leaderassess-api`)

| Variable | Value | Notes |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://...` | From Atlas step above |
| `CORS_ORIGINS` | `https://leaderassess-frontend.onrender.com` | Your frontend URL |
| `APP_URL` | `https://leaderassess-frontend.onrender.com` | For email links |
| `RESEND_API_KEY` | `re_xxxx` | From resend.com (optional) |
| `JUDGE0_API_URL` | `https://judge0-ce.p.rapidapi.com` | Optional |
| `JUDGE0_API_KEY` | Your RapidAPI key | Optional |

> `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` are auto-injected by Render Blueprint.

### Frontend (`leaderassess-frontend`)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://leaderassess-api.onrender.com/api/v1` |

---

## 6. GitHub Secrets for CI/CD

Go to each GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:

### Backend repo secrets

| Secret name | Where to get it |
|---|---|
| `RENDER_DEPLOY_HOOK_BACKEND` | Render → leaderassess-api → Settings → Deploy Hook → Copy URL |
| `CODECOV_TOKEN` | codecov.io → your repo → Settings → token (optional) |

### Frontend repo secrets

| Secret name | Where to get it |
|---|---|
| `RENDER_DEPLOY_HOOK_FRONTEND` | Render → leaderassess-frontend → Settings → Deploy Hook → Copy URL |
| `VITE_API_URL` | `https://leaderassess-api.onrender.com/api/v1` |

---

## 7. First Deploy Checklist

- [ ] MongoDB Atlas cluster created, connection string saved
- [ ] Both repos pushed to GitHub
- [ ] Render Blueprints applied (both services green)
- [ ] `MONGODB_URI` and `CORS_ORIGINS` set in Render backend env
- [ ] `VITE_API_URL` set in Render frontend env
- [ ] GitHub Secrets set in both repos
- [ ] Push a commit to `main` to trigger CI/CD
- [ ] Check GitHub Actions → all jobs green
- [ ] Visit `https://leaderassess-api.onrender.com/health` → `{"status":"ok"}`
- [ ] Visit frontend URL → app loads

---

## 8. Local Development

```bash
# Terminal 1 — Backend
cd leadership-assessment-backend
cp .env.example .env          # fill in your values
npm install
npx prisma migrate dev        # creates tables
npx ts-node prisma/seed.ts    # seeds 500 questions
npm run dev

# Terminal 2 — Frontend
cd leadership-assessment
npm install
echo "VITE_API_URL=http://localhost:4000/api/v1" > .env
npm run dev
```

**Required local services**: PostgreSQL 16, MongoDB 7, Redis 7
Quick start with Docker:
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:16-alpine
docker run -d -p 27017:27017 mongo:7
docker run -d -p 6379:6379 redis:7-alpine
```

---

## 9. Resend Email Setup (Production)

1. Create account at [resend.com](https://resend.com)
2. Add your domain (or use the sandbox `onboarding@resend.dev` for testing)
3. **API Keys** → Create key → Copy
4. Set `RESEND_API_KEY=re_xxxx` in Render backend env
5. Set `EMAIL_FROM=noreply@yourdomain.com` (must match verified domain)

Without Resend, the backend logs emails to console — useful in development.

---

## 10. Render Free Tier Notes

- Free web services **spin down after 15 min of inactivity** — first request takes ~30s
- Upgrade to **Starter ($7/mo)** for always-on
- Free PostgreSQL: 256MB storage, expires after 90 days — upgrade or pg_dump regularly
- Free Redis: 25MB, no persistence — data lost on restart (sessions survive via PostgreSQL)
