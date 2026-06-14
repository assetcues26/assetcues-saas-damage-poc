# AssetCues Asset Analysis (Frontend)

React + Vite app for capturing or uploading asset images, running AI analysis, and viewing history and PDF reports.

## Local development

```bash
npm install
npm run dev
```

Optional: copy `.env.example` to `.env.local` and set variables (see below).

## Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Add New Project** → import `assetcues26/assetcuesassetanalysis`.
3. Framework preset **Vite** is detected automatically (`vercel.json` is included).
4. Add environment variables (Production):

   | Variable | Description |
   |----------|-------------|
   | `VITE_ASSET_ANALYSIS_API_BASE` | Analysis API base URL (optional; has a default) |
   | `VITE_APP_BASE_URL` | Full public URL of this deployment (for PDF “view online” links) |

5. Deploy. Client-side routes (`/capture`, `/history`, `/result/:id`, etc.) use SPA rewrites in `vercel.json`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |

## GitHub

```bash
git remote add origin https://github.com/assetcues26/assetcuesassetanalysis.git
git branch -M main
git push -u origin main
```
