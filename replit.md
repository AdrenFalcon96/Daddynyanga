# Samanyanga Companion

## Overview

Full-stack Zimbabwe agricultural marketplace and learning platform. pnpm workspace monorepo with an Express 5 API backend and React/Vite frontend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 (ESM, esbuild bundled)
- **Frontend**: React 18 + Vite + TailwindCSS v4
- **Database**: PostgreSQL (raw pg driver, `scripts/src/init-db.ts` for schema)
- **Auth**: Custom JWT (HMAC-SHA256), `role`-based access
- **AI**: Replit OpenRouter integration (Mistral Ministral-8B) → OpenAI fallback; rich client-side offline fallback; DALL-E 3 for image gen; SISIF.AI for video gen
- **Mobile**: Capacitor v8 configured for Android APK builds (`artifacts/samanyanga/capacitor.config.ts`, `codemagic.yaml` at repo root)
- **Payments**: EcoCash — account 0783652488
- **Deployment**: Render (render.yaml at root)

## Structure

```text
workspace/
├── artifacts/
│   ├── samanyanga/          # React/Vite frontend (port 21688 dev)
│   └── api-server/          # Express API server (port 8080 dev)
├── scripts/
│   └── src/init-db.ts       # DB schema + seed (run with pnpm --filter @workspace/scripts run init-db)
├── render.yaml              # Render.com deployment config (API web service + static site)
├── .env.example             # Environment variable template
└── replit.md                # This file
```

## Workflows

- `artifacts/api-server: API Server` — Express API on port 8080
- `artifacts/samanyanga: web` — Vite dev server on port 21688

## Frontend Routes

- `/` — Home (role selector, nav)
- `/login` — User login/register
- `/admin-login` — Admin portal login (clean, no demo accounts exposed)
- `/admin` — Admin Dashboard (requires `role === "admin"` JWT)
- `/farmer` — Farmer marketplace + AI
- `/buyer` — Buyer marketplace + AI
- `/seller` — Seller listings + AI
- `/student-companion` — Study Companion (ZIMSEC, dynamic subjects)
- `/agri-intern` — Agri-intern attachment portal
- `/consultation` — Book a consultation
- `/public-ads` — Public ads/adverts
- `/adverts/:id` — Single advert detail

## Admin Dashboard Tabs

1. **Image Adverts** — Review, AI-generate (DALL-E 3), upload, approve, publish image ads
2. **Video Adverts** — Review, AI-generate (SISIF.AI), upload, approve, publish video ads
3. **Media Hub** — Create/edit/delete/publish/distribute ads; social sharing (WhatsApp, Facebook, Twitter, LinkedIn); API payload export; AI image generation
4. **Products** — Review product purchase requests
5. **Interns** — Review intern attachment applications
6. **Consultations** — Review and respond to consultations
7. **Revenue** — Track EcoCash payments, advert & consultation revenue; mark transactions as paid/refunded
8. **Study Materials** — Upload PDFs, images, videos, URLs for students
9. **Subjects** — Full CRUD for ZIMSEC subjects by grade level (Grade 7, O Level, A Level); changes reflect immediately in Study Companion
10. **Security & Access** — Demo account credentials (admin-only view), security notes, JWT info

## API Routes

### Public
- `GET /api/ads` — Published ads
- `GET /api/products` — Available products
- `GET /api/subjects` — Active subjects (consumed by Study Companion)
- `GET /api/study-materials` — Study materials (with grade/subject filters)
- `POST /api/login` — Login
- `POST /api/register` — Register
- `GET /api/me` — Current user
- `POST /api/advert-requests` — Submit advert request
- `POST /api/intern-attachments` — Submit intern application
- `POST /api/consultations` — Submit consultation request
- `POST /api/ai/hybrid` — AI chat (OpenRouter → OpenAI fallback)
- `POST /api/ai/student` — Student AI
- `POST /api/ai/chat` — Farmer AI
- `POST /api/ai/generate-image` — Image generation (DALL-E 3 → placeholder) **(requires Bearer token)**
- `POST /api/ai/generate-video` — Video generation (SISIF.AI → placeholder) **(requires Bearer token)**

### Admin (requires Bearer JWT with role=admin)
- `GET/POST /api/admin/ads` — All ads management
- `PATCH/DELETE /api/admin/ads/:id` — Edit/delete specific ad
- `GET /api/admin/advert-requests` — All advert requests
- `PATCH /api/admin/advert-requests/:id` — Update status
- `POST /api/admin/advert-requests/:id/publish` — Publish to public ads
- `POST /api/admin/generate-image` — Generate image for advert request
- `POST /api/admin/generate-video` — Generate video for advert request
- `GET /api/admin/subjects` — All subjects (including inactive)
- `POST /api/admin/subjects` — Add subject
- `PATCH /api/admin/subjects/:id` — Edit/toggle subject
- `DELETE /api/admin/subjects/:id` — Delete subject
- `GET /api/admin/product-requests` — Product requests
- `GET /api/admin/consultations` — All consultations
- `PATCH /api/admin/consultations/:id` — Respond to consultation
- `GET /api/admin/revenue` — Revenue summary
- `GET /api/admin/transactions` — All transactions
- `PATCH /api/admin/transactions/:source/:id` — Update payment status
- `GET/POST /api/admin/study-materials` — Manage study materials
- `DELETE /api/admin/study-materials/:id` — Delete material

## Database Tables

- `users` — id, email, password (HMAC-SHA256 hashed), role, display_name
- `products` — listings by farmers/sellers
- `product_requests` — buyer purchase requests
- `ads` — published advertisements (image or video)
- `advert_requests` — submitted advert requests (pending admin review)
- `intern_attachment_requests` — intern applications
- `consultations` — consultation bookings
- `study_materials` — uploaded study content (file stored as base64 or URL)
- `subjects` — ZIMSEC curriculum subjects by grade (dynamic, admin-managed)

## Offline Architecture

The app is a full PWA with layered offline support:

| Layer | Mechanism | File |
|---|---|---|
| App shell & static assets | Workbox CacheFirst service worker | `vite.config.ts` |
| API browse data (products, subjects, ads) | Workbox NetworkFirst, 24h expiry | `vite.config.ts` |
| Study material files (PDFs, video) | Manual Cache API save via "save offline" button | `lib/offlineStorage.ts` |
| AI responses | Cached in localStorage (last 60 replies, keyed by message) | `lib/aiEngine.ts` |
| AI keyword fallbacks | 25 local keyword→answer pairs (no network needed) | `lib/aiEngine.ts` |
| Form submission queue | Free consultations + intern applications queued in localStorage; auto-replayed on reconnect | `lib/offlineQueue.ts` |
| Offline/online detection | `useOffline` hook + `OfflineBanner` (red/green, accurate messaging) | `hooks/useOffline.ts`, `components/OfflineBanner.tsx` |
| Queue delivery notification | Purple "📤 X submissions delivered" banner on reconnect | `components/OfflineBanner.tsx`, `hooks/useOffline.ts` |

**What does NOT work offline:** paid consultation (agronomic, requires payment flow), AI image/video generation (server-side only).

## Admin Setup & Recovery

### First-Time Admin Registration
On a **fresh deployment** (no admin in database): visiting `/admin-login` automatically shows a "Create Admin Account" form. Enter your email and a strong password (min. 8 chars). This can only be done once — after an admin is created, the setup form is permanently replaced by the login form. Only one admin account is allowed.

### Emergency Reset (Published App — Locked Out)
If you are locked out of the admin account (e.g. the seeded `demo123` password doesn't work in production):
1. Go to your **Render dashboard → Environment** and add: `ADMIN_RESET_KEY=<any-random-secret>`
2. Redeploy/restart the service to pick up the new env var
3. Go to `/admin-login` → click **"Locked out?"**
4. Fill in your reset key, your email, and new password → click **"Reset & Create Admin"**
5. You will be logged in automatically
6. **Remove `ADMIN_RESET_KEY`** from Render env vars after use (for security)

### Notes
- The demo seed no longer includes `admin@demo.com` — only farmer/student/buyer/seller demo accounts are seeded
- Existing `admin@demo.com` records in old databases are NOT automatically removed; use the reset flow to replace them

## Auth & Security

- JWT: HMAC-SHA256, 7-day expiry, signature **verified** on every protected request using `timingSafeEqual`
- `JWT_SECRET` env var is **optional**: if not set, a stable secret is automatically derived from `DATABASE_URL` via HMAC-SHA256. This means no extra env var is needed on Render as long as `DATABASE_URL` is set.
- Password hashing uses a separate stable `PASSWORD_SALT` (independent of JWT_SECRET, so rotating JWT_SECRET doesn't invalidate passwords)
- Admin access: `role === "admin"` strictly enforced, no email-based bypass
- AI generate-image, generate-video, and admin AI endpoints require valid Bearer token (prevents API abuse)
- Shared JWT utility in `artifacts/api-server/src/lib/jwt.ts` — all routes use `verifyToken()` / `signToken()` / `hashPassword()`
- No hardcoded secrets in source code; all keys via env vars
- Demo credentials: `admin@demo.com / demo123`, `farmer@demo.com / demo123`, etc.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Farmer | farmer@demo.com | demo123 |
| Student | student@demo.com | demo123 |
| Buyer | buyer@demo.com | demo123 |
| Seller | seller@demo.com | demo123 |

> Admin is no longer a demo account. Use the first-time setup or emergency reset flow (see Admin Setup & Recovery above).

## AI Integration

- **Hybrid endpoint** (`/api/ai/hybrid`): OpenRouter → OpenAI → local keyword tips → fallback strings
- **Image generation** (`/api/admin/generate-image`, `/api/ai/generate-image`): DALL-E 3 via OpenAI → Picsum placeholder
- **Video generation** (`/api/admin/generate-video`, `/api/ai/generate-video`): SISIF.AI polling → placeholder MP4
- **Section-aware**: Each admin tab and user page has its own system prompt

## Deployment (Render)

See `render.yaml` at root. Two separate Render services:

### `samanyanga-api` (Web Service)
- Builds and runs the Express API server only
- Required env vars: `DATABASE_URL`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`
- `JWT_SECRET` is **optional** — automatically derived from `DATABASE_URL` if not set

### `samanyanga-web` (Static Site)
- Builds the Vite/React frontend and publishes it as a static site
- Required env vars: `VITE_API_URL` — set to your `samanyanga-api` Render URL (e.g. `https://samanyanga-api.onrender.com`)
- All routes rewrite to `/index.html` for SPA support

## Wallpaper

`artifacts/samanyanga/public/graduation.webp` — applied as subtle background (10% opacity) across all pages via `index.css` body::before pseudo-element.
