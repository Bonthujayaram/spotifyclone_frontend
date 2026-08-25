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

That is the only one. Firebase config lives in
[src/lib/firebase.ts](src/lib/firebase.ts) rather than the environment: it is
public client identification, and keeping it in source removes a way for the
deploy to silently break sign-in.

> **Never commit `.env`.** It is gitignored.

---

## Deploying to Netlify

`netlify.toml` sets the build command, publish directory and the SPA fallback,
so a fresh site needs no manual build config.

Set `VITE_API_URL` under **Site configuration → Environment variables**, *not*
in a committed file. It must point at the deployed backend — left at
`http://localhost:5000/api`, the deployed site calls the visitor's own machine
and every request fails.

Two things elsewhere must name this site's URL, and both live in their own
dashboards — so **renaming the Netlify site means updating them by hand**:

- The backend's `CORS_ORIGIN` env var, or every API call returns 403.
- Firebase → Authentication → Settings → **Authorized domains**, or Google and
  Apple sign-in fail with `auth/unauthorized-domain`.

---

## Notes

- The entry bundle is ~482 KB (135 KB gzipped) — React, the router, both
  contexts, the auth screens and the Firebase Auth SDK. Everything behind auth
  is route-split, including `Layout`, which is what keeps Leaflet off the login
  page.
- The catalog API (`saavn.sumit.co`) is a third-party mirror with no key, no
  SLA and no caching layer in front of it. If it goes down, search and playback
  go with it.
