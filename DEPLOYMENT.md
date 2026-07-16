# TourSafe — Deployment Guide

TourSafe is **BYOK** and deploys to Vercel with **no environment variables and no code
changes**. Everything is configured from the app UI after deploy.

## 1. Push to GitHub

```bash
git init            # already initialized if you cloned this repo
git add .
git commit -m "TourSafe: initial commit"
git branch -M main
git remote add origin https://github.com/<you>/toursafe.git
git push -u origin main
```

## 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new).
2. **Import** your GitHub repository.
3. Framework preset is auto-detected as **Next.js**. Leave build settings default:
   - Build command: `next build`
   - Output: `.next`
4. Environment variables: **none required** (all optional — see `.env.example`).
5. Click **Deploy**.

## 3. Configure after deploy (evaluator flow)

Open the deployed URL, then:

1. **Settings → AI Configuration** → paste your Gemini key → **Save** → **Test Connection**.
2. *(Optional)* **Settings → Maps Configuration** → paste your Google Maps key → **Save**.
3. *(Optional)* **Settings → Supabase** → paste URL + anon key (after running `supabase/schema.sql`).

Everything else works immediately in local demo mode.

## Local production check

```bash
npm install
npm run lint     # ✔ no warnings or errors
npm run build    # ✔ compiles, zero TypeScript errors
npm run start    # serve production build on :3000
```

## Common gotchas

| Symptom | Fix |
|---|---|
| Map shows "Map not configured" | Add a Maps key in Settings → Maps Configuration and enable *Maps JavaScript API*. |
| AI shows "not configured" | Add a Gemini key in Settings → AI Configuration. |
| "Invalid API key" on Test | Regenerate the key at aistudio.google.com and ensure the Generative Language API is enabled. |
| Police queue empty | Trigger an SOS from the Tourist app, or click **Simulate** in the Command Center. |
