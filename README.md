# Flagship Tracker — Frontend

React frontend for the Flagship Tracker application. Built with React Router v7 (SSR), TanStack Query, HeroUI v3, Tailwind CSS v4, Recharts, and Framer Motion.

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| [React Router v7](https://reactrouter.com) | SSR framework, file-based routing, loaders |
| [TanStack Query v5](https://tanstack.com/query) | Server state, caching, background refetching |
| [HeroUI v3](https://heroui.com) | Component library (Tailwind v4 + React Aria) |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Recharts](https://recharts.org) | Charts on dashboards |
| [Framer Motion](https://www.framer.com/motion) | Page transition animations |
| [@tabler/icons-react](https://tabler.io/icons) | Icon library used across all components |

---

## Prerequisites

- Node.js 20+
- pnpm 9+
- Java Spring Boot backend running (see backend repo)

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Copy environment file and set your API URL
cp .env.example .env

# Start development server
pnpm dev
```

The app runs at `http://localhost:5173` by default.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Base URL of the Spring Boot backend | `http://localhost:8080` |

---

## Project Structure

```
app/
├── components/
│   ├── page-transition.tsx    # Framer Motion page fade/slide wrapper (used in layouts)
│   └── top-progress-bar.tsx   # React Router navigation state
├── data/                      # Dummy data for development and UI prototyping only
│   ├── dummy-data.ts          # General shared dummy data
│   └── dummy-flagships.ts     # Example: resource-specific dummy data files go here
├── lib/
│   ├── api.ts                 # Reusable fetch wrapper for all HTTP methods
│   ├── query-client.ts        # TanStack Query client with retry/stale config
│   └── queries/               # Query options factories (one file per resource)
│       ├── flagships.ts
│       ├── dashboard.ts
│       ├── reports.ts
│       └── users.ts
├── routes/
│   ├── index.tsx              # / → redirects to /login
│   ├── login/index.tsx
│   ├── admin/
│   │   ├── layout.tsx         # Admin layout + nav tabs + prefetch
│   │   ├── dashboard/index.tsx
│   │   ├── flagships/
│   │   │   ├── index.tsx
│   │   │   └── $id/index.tsx
│   │   ├── reports/index.tsx
│   │   └── users/index.tsx
│   ├── me/                    # M&E user group
│   │   ├── layout.tsx
│   │   └── flagships/
│   │       ├── index.tsx
│   │       └── $id/index.tsx
│   └── senior/                # Senior Officials user group
│       ├── layout.tsx
│       ├── dashboard/index.tsx
│       ├── flagships/
│       │   ├── index.tsx
│       │   └── $id/index.tsx
│       └── reports/index.tsx
├── routes.ts                  # Routes config
├── root.tsx                   # App shell: QueryClientProvider, Toast.Provider, TopProgressBar
└── app.css                    # Tailwind + HeroUI styles + custom theme variables
```

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

## User Groups and Routes

| Group | Routes | Prefetched on layout load |
|-------|--------|--------------------------|
| Admin | `/admin/dashboard`, `/admin/flagships`, `/admin/flagships/:id`, `/admin/reports`, `/admin/users` | dashboard, flagships, reports, users |
| M&E | `/me/flagships`, `/me/flagships/:id` | flagships |
| Senior Officials | `/senior/dashboard`, `/senior/flagships`, `/senior/flagships/:id`, `/senior/reports` | dashboard, flagships, reports |

---

## Available Scripts

```bash
pnpm dev          # Development server with HMR
pnpm build        # Production build
pnpm start        # Serve production build
pnpm typecheck    # Type generation + TypeScript check
pnpm lint         # Run ESLint across the app
```

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
