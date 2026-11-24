# Flagship Tracker — Frontend

[![CI](https://github.com/ganzafrica-org/flagship-tracker-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/ganzafrica-org/flagship-tracker-frontend/actions/workflows/ci.yml)
[![CodeQL](https://github.com/ganzafrica-org/flagship-tracker-frontend/actions/workflows/codeql.yml/badge.svg)](https://github.com/ganzafrica-org/flagship-tracker-frontend/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/ganzafrica-org/flagship-tracker-frontend/badge)](https://securityscorecards.dev/viewer/?uri=github.com/ganzafrica-org/flagship-tracker-frontend)
![Last commit](https://img.shields.io/github/last-commit/ganzafrica-org/flagship-tracker-frontend)
![React Router 7](https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS 4](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vite 7](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-offline%20drafts-5A0FC8?logo=pwa&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)

Web app for the Flagship Tracker platform of the Ministry of Agriculture and Animal Resources, Rwanda. Monitoring officers, administrators and senior officials use it to follow flagship programmes, their value chains, funders, cooperatives and individual beneficiaries, view dashboards and download reports. It talks to the [Flagship Tracker backend](https://github.com/ganzafrica-org/flagship-tracker-backend) over REST.

It is built as a **single-page app** (`ssr: false` in `react-router.config.ts`) and installs as a **PWA**. Add-forms can be filled in offline and saved as drafts, then sent when the connection is back.

---

## Features

- Role-based areas for **Admin**, **M&E** (monitoring officers) and **Senior Officials**
- Flagships with detail pages, individuals, cooperatives and funders (list, add, update)
- Bulk **import** of flagships, individuals and cooperatives from spreadsheets
- Dashboards (national and youth) with charts and Leaflet maps
- Reports and **exports** to Excel and PDF
- Offline drafts for add-forms (IndexedDB through Dexie) with replay when back online
- Login with forgot-password, code verification and forced password change

---

## Tech stack

| Tool | Purpose |
|------|---------|
| [React Router v7](https://reactrouter.com) | Framework mode, file-based route config, loaders (SPA build) |
| [TanStack Query v5](https://tanstack.com/query) | Server state, caching, background refetching |
| [HeroUI v3](https://heroui.com) | Component library (Tailwind v4 + React Aria) |
| [Tailwind CSS v4](https://tailwindcss.com) | Styling |
| [Recharts](https://recharts.org) and [Chart.js](https://www.chartjs.org) | Charts |
| [Leaflet](https://leafletjs.com) / react-leaflet | Maps |
| [Dexie](https://dexie.org) | IndexedDB for offline drafts |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) / Workbox | Service worker and offline shell |
| ExcelJS, SheetJS (`xlsx`), jsPDF, `@react-pdf/renderer` | Spreadsheet import, Excel and PDF export |
| [Framer Motion](https://www.framer.com/motion) | Page transitions |
| [@tabler/icons-react](https://tabler.io/icons) | Icons |
| [rwanda](https://www.npmjs.com/package/rwanda) | Administrative locations (province to village) |

---

## Prerequisites

- Node.js 20+ (the Docker image uses 22)
- pnpm 10 (see `packageManager` in `package.json`; `corepack enable` is enough)
- The [backend](https://github.com/ganzafrica-org/flagship-tracker-backend) running locally or reachable

---

## Getting started

```bash
pnpm install
cp .env.example .env     # set VITE_API_BASE_URL
pnpm dev                 # http://localhost:5173
```

### Environment variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Base URL of the backend | `http://localhost:8080` |

Vite inlines `VITE_*` values at **build time**, so rebuild after changing it.

### Scripts

```bash
pnpm dev          # Dev server with HMR
pnpm build        # Production build (static files in build/client)
pnpm typecheck    # react-router typegen + tsc
pnpm lint         # ESLint on app/
```

`pnpm start` is also defined, but because the app is built as an SPA the output is static: serve `build/client` with any static host (see below) instead.

---

## Deployment

- **Docker**: the `Dockerfile` builds the app (pass `--build-arg VITE_API_BASE_URL=https://your-api`) and serves `build/client` with nginx on port 3000, with SPA fallback to `index.html` and no-cache headers for `sw.js` and `index.html`. This is what Coolify uses.
- **Netlify**: `netlify.toml` runs `pnpm install && pnpm run build`, publishes `build/client` and rewrites every path to `/index.html`.

---

## Project structure

```
app/
├── components/
│   ├── auth/ dashboard/ navigation/ pages/ import/ pdf-format/ offline-drafts/
│   ├── page-transition.tsx     # Framer Motion wrapper used in layouts
│   └── top-progress-bar.tsx    # Router navigation state
├── data/                       # Dummy data for prototyping only (dummy-<resource>.ts)
├── lib/
│   ├── api.ts                  # Fetch wrapper (adds the token, reads VITE_API_BASE_URL)
│   ├── auth.ts, session.server.ts
│   ├── query-client.ts         # TanStack Query client
│   ├── queries/                # Query options, one file per resource
│   ├── offline-drafts/         # Dexie db, repository, replay when back online
│   ├── flagship-import/, individual-import/, cooperative-import/, import/
│   └── export/                 # Excel and PDF export helpers
├── routes/
│   ├── index.tsx               # Redirects by session and role
│   ├── login/                  # login, forgot-password, verify-code, change-password
│   ├── admin/                  # dashboard, flagships, individuals, cooperatives, funders, reports, users, youth
│   ├── me/                     # M&E: flagships, individuals, cooperatives, funders, reports, youth
│   └── senior/                 # Senior officials: dashboards, flagships, individuals, cooperatives, funders, reports
├── routes.ts                   # Route config
├── root.tsx                    # App shell and providers
└── app.css                     # Tailwind, HeroUI and theme variables
public/                         # Icons, service worker activation script, template PDF
```

---

## User groups

| Group | Base path | Main pages |
|-------|-----------|------------|
| Admin | `/admin` | dashboard, youth dashboard, flagships, individuals, cooperatives, funders, reports, users |
| M&E | `/me` | flagships, individuals, cooperatives, funders, reports, youth dashboard |
| Senior Officials | `/senior` | dashboard, youth dashboard, flagships, individuals, cooperatives, funders, reports |

After login, `getRoleHomePath` in `app/lib/auth.ts` sends each user to their group.

---

## Data Fetching Pattern

The app combines React Router loaders with TanStack Query in two ways:

### Prefetch on layout load (list / dashboard pages)
Layout loaders call `queryClient.prefetchQuery()` — non-blocking, returns immediately. Child pages show **skeleton loaders** while fetches complete in the background.

```ts
// admin/layout.tsx
export async function loader() {
  queryClient.prefetchQuery(flagshipsQueryOptions); // fire and forget
  return null;
}

// admin/flagships/index.tsx
const { data, isLoading } = useQuery(flagshipsQueryOptions);
// isLoading = true while prefetch is in flight → show skeletons
```

### Block on detail load (single resource pages)
Detail page loaders call `queryClient.ensureQueryData()` — blocks render until data is in cache. The component always receives data immediately. The **top progress bar** handles the visible wait.

```ts
// admin/flagships/$id/index.tsx
export async function loader({ params }) {
  await queryClient.ensureQueryData(flagshipQueryOptions(Number(params.id)));
  return null;
}

const { data } = useQuery(flagshipQueryOptions(id));
// data is always defined — loader guaranteed it
```

### Adding a new API resource

1. Create `app/lib/queries/my-resource.ts` with a `queryOptions()` factory
2. Add `queryClient.prefetchQuery(myResourceQueryOptions)` to the relevant layout loader
3. Call `useQuery(myResourceQueryOptions)` in the page component
4. Replace the dummy `queryFn` with `api.get(...)` once the backend endpoint is ready

---

## Code Conventions

Enforced via ESLint (`eslint.config.js`). Run `pnpm lint` to check.

### Filenames
All `.ts` and `.tsx` files must use **kebab-case**.

```
stat-card.tsx        ✅
query-client.ts      ✅
StatCard.tsx         ❌
queryClient.ts       ❌
```

### Naming
| Target | Convention | Example |
|--------|-----------|---------|
| Variables | `camelCase` or `UPPER_CASE` | `flagshipList`, `MAX_RETRIES` |
| Functions | `camelCase` (utilities/hooks) or `PascalCase` (components) | `fetchData()`, `StatCard()` |
| Parameters | `camelCase` (leading `_` allowed for unused) | `params`, `_event` |
| Types / Interfaces / Enums | `PascalCase` | `FlagshipStatus`, `StatCardProps` |

### Quotes
Always use **double quotes** for strings.

```ts
const name = "Flagship Tracker";   ✅
const name = 'Flagship Tracker';   ❌
```

### Dummy Data
All mock/dummy data lives in `app/data/`. Create one file per resource, named `dummy-<resource>.ts`.

```
app/data/dummy-flagships.ts    ✅
app/data/dummy-reports.ts      ✅
app/data/dummyData.ts          ❌
```
