# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Samanyanga Companion App

**Artifact**: `artifacts/samanyanga` — Zimbabwe agricultural marketplace web app (React + Vite, served at `/`)

### Pages
- `/` — Home (hero, feature cards, Login/Register/Browse Adverts buttons)
- `/login` — Login with show/hide password toggle; demo accounts shown
- `/register` — Registration with role selection (farmer/merchant/seller/student)
- `/public-ads` — Public adverts with image/video split layout, WhatsApp/Facebook/Instagram/X share buttons, custom ad request form
- `/farmer` — Farmer dashboard: browse marketplace + manage listings
- `/buyer` — Merchant/Buyer dashboard: browse marketplace
- `/seller` — Seller dashboard: manage listings + browse marketplace
- `/student-companion` — AI study chat (Grade 7/O Level/A Level) + Study Materials browser tab (view/download PDFs, images, videos)
- `/admin` — Full admin dashboard (8 tabs: Image Adverts, Video Adverts, Products, Interns, Consultations, Revenue, Study Materials, Security)
- Graduation photo wallpaper applied as a fixed, very subtle (7% opacity) body background across all pages

### Admin Dashboard Tabs
- **Image Adverts** — Review/approve/reject image advert requests; generate AI images; preview + download
- **Video Adverts** — Review/approve/reject video advert requests; generate AI videos; preview + download
- **Products** — Accept/reject product purchase requests from buyers
- **Interns** — Accept/reject agricultural intern attachment applications
- **Consultations** — Review consultation requests and write responses
- **Revenue** — Revenue stats (total, adverts, consultations); all transactions list with Mark Paid / Refund / Reset; EcoCash account 0783652488
- **Study Materials** — Upload PDFs/images/video URLs for students by grade and subject; preview + download + delete
- **Security** — Demo account credentials display with copy-to-clipboard buttons + security notes

### Backend Routes (API Server, port 8080)
- `POST /api/login` — returns JWT token + user role
- `POST /api/register` — register new user (roles: farmer/merchant/seller/student)
- `GET /api/me` — get current user from Bearer token
- `GET /api/ads` — list all public adverts
- `POST /api/advert-requests` — submit custom ad request
- `GET /api/products[?category=...]` — list products
- `GET /api/products/:id` — product detail
- `POST /api/products` — create product listing
- `POST /api/products/:id/request` — request a product (buyer contacts seller)
- `POST /api/ai/hybrid` — hybrid AI endpoint (OpenAI + local fallback), section-specific prompts
- `GET /api/admin/revenue` — revenue summary (totals, paid counts, EcoCash details)
- `GET /api/admin/transactions` — all payment transactions (adverts + consultations combined)
- `PATCH /api/admin/transactions/:source/:id` — update payment_status (paid/pending/refunded)
- `GET /api/admin/consultations` — list consultations
- `PATCH /api/admin/consultations/:id` — respond to consultation
- `GET /api/admin/study-materials` — admin list of all uploaded study materials
- `POST /api/admin/study-materials` — upload new study material (base64 for PDF/image, URL for video)
- `DELETE /api/admin/study-materials/:id` — delete study material
- `GET /api/study-materials[?grade=&subject=]` — public student-facing material list
- `GET /api/study-materials/:id/data` — serve file or redirect to URL

### Database Tables
- `users` — email, password_hash, role, name
- `ads` — published adverts (image_url, video_url, title, description)
- `advert_requests` — user-submitted ad requests (advert_type: image/video)
- `products` — marketplace listings
- `product_requests` — buyer purchase requests
- `consultations` — consultation requests (response, payment_status)
- `intern_attachments` — intern application requests
- `study_materials` — uploaded resources (base64 file_data or URL, grade, subject, file_type)

### Demo Accounts (password: `demo123`)
- admin@demo.com → Full Admin Dashboard
- farmer@demo.com → Farmer Dashboard
- buyer@demo.com → Merchant Dashboard
- seller@demo.com → Seller Dashboard
- student@demo.com → Student Companion

### Payments
- EcoCash account: 0783652488
- Standard Advert: $10 · Premium Advert: $25 · Agronomic Consultation: $5

### Vite Proxy
Vite proxies `/api` → `http://localhost:8080` in dev mode.

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT` (defaults to `8080`), starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
