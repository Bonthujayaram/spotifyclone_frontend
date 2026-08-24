# EchoVibe — frontend

React 18 + Vite + TypeScript + Tailwind/shadcn. Runs on port **5173**.

API lives in a separate repo:
[spotify_clone_backend](https://github.com/Bonthujayaram/spotify_clone_backend).

Search results, metadata and audio come from the public JioSaavn API at
runtime — the backend only stores your account data (liked songs, playlists,
recently-played, follows, creator uploads).

---

## Setup

Node 20+.

```bash
npm install
cp .env.example .env      # then set VITE_API_URL
```

Start the backend first (see its repo), then:

```bash
npm run dev        # http://localhost:5173
npm run build      # production build to dist/
npm run preview    # serve the build
npm run lint
npx tsc --noEmit -p tsconfig.app.json    # typecheck
```

---

## Configuration

`VITE_*` values are **baked into the bundle at build time**, not read at
runtime. Changing one means rebuilding and redeploying.

| Variable | Notes |
|---|---|
| `VITE_API_URL` | Backend base URL **including `/api`**, e.g. `http://localhost:5000/api` |
| `VITE_APP_NAME` | Display name |
| `VITE_JWT_LOCAL_STORAGE_KEY` | localStorage key for the token (`token`) |
| `VITE_ENABLE_GOOGLE_LOGIN` | `true` / `false` |
| `VITE_GOOGLE_CLIENT_ID` | Google Identity Services client ID |
| `VITE_GOOGLE_ALLOWED_ORIGINS` | Comma-separated origins where Google sign-in may run |

> **Never commit `.env`.** It is gitignored.

---

## Deploying to Netlify

`netlify.toml` sets the build command, publish directory and the SPA fallback,
so a fresh site needs no manual build config.

Set the `VITE_*` variables under **Site configuration → Environment variables**,
*not* in a committed file. At minimum `VITE_API_URL` must point at the deployed
backend — if it is left at `http://localhost:5000/api`, the deployed site will
try to call the visitor's own machine and every request will fail.

Two things must line up on the backend side:

- `CORS_ORIGIN` there must include this site's URL.
- `VITE_GOOGLE_ALLOWED_ORIGINS` here, and the Authorized JavaScript Origins in
  Google Cloud Console, must both include it too, or Google sign-in silently
  refuses to render.

---

## Notes

- The entry bundle is ~685 KB (205 KB gzipped). `Profile`, `AIDJPage`,
  `CreatorStudio` and `Upload` are route-split; the rest is mostly Leaflet,
  pulled in by the discovery map that renders in the sidebar on every page.
  Gating that map behind its own dialog is the next real win.
- The catalog API (`saavn.sumit.co`) is a third-party mirror with no key, no
  SLA and no caching layer in front of it. If it goes down, search and playback
  go with it.
