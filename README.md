# New Damage POC

This workspace holds two **independent** projects for separate GitHub repos:

| Folder     | Stack              | Port (dev) |
|------------|--------------------|------------|
| `backend/` | Asset Analysis API (FastAPI + Gemini) | 8000 |
| `frontend/`| React + Vite (from [assetcuesassetanalysis](https://github.com/assetcues26/assetcuesassetanalysis)) | 5173 |

## Local development

1. Start backend: `cd backend` → `python -m venv .venv` → `.venv\Scripts\activate` → `pip install -r requirements-dev.txt` → copy `.env.example` to `.env` (set `GEMINI_API_KEY`) → `.\run.ps1`
2. Start frontend: `cd frontend` → `npm install` → copy `.env.example` to `.env.local` (set `VITE_ASSET_ANALYSIS_API_BASE=http://localhost:8000`) → `npm run dev`

Each folder has its own `.gitignore` and README. Initialize git **inside** each folder when you are ready to push to separate repositories.

## Multi-region valuation rollout

1. Deploy backend with `MULTI_MARKET_ENABLED=false` (no behavior change).
2. Enable `MULTI_MARKET_ENABLED=true` on the backend after smoke checks.
3. Deploy frontend (region selector in app settings).
4. Smoke-test one asset each for IN, US, and GB.

**Rollback:** set `MULTI_MARKET_ENABLED=false` on the backend Vercel env, or redeploy the previous frontend. See `backend/README.md` for API details.

## SaaS asset register module

Isolated demo module for fixed-asset registration + Tagging AI validation.

**Enable:**
- Backend: `SAAS_ASSETS_ENABLED=true`, `SUPABASE_PERSIST_ENABLED=true`, Supabase credentials, run migration `004_saas_assets.sql`
- Frontend: `VITE_SAAS_MODULE_ENABLED=true`

**Routes when enabled:** `/` = assets dashboard, `/assets/create` = web form, `/poc` = original capture POC, `/assets/create/mobile/:token` = mobile QR create flow.

**API:** `/v1/saas/assets`, `/v1/saas/asset-sessions` (proxies Tagging AI on analyze).
