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
- **AI**: OpenRouter → OpenAI fallback chain; DALL-E 3 for image gen; SISIF.AI for video gen
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
├── render.yaml              # Render.com deployment config (combined service)
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

## Auth & Security

- JWT: HMAC-SHA256, 7-day expiry, signature **verified** on every protected request using `timingSafeEqual`
- `JWT_SECRET` env var is **required** in production (auto-generated and stored); throws if missing in prod
- Password hashing uses a separate stable `PASSWORD_SALT` (independent of JWT_SECRET, so rotating JWT_SECRET doesn't invalidate passwords)
- Admin access: `role === "admin"` strictly enforced, no email-based bypass
- AI generate-image, generate-video, and admin AI endpoints require valid Bearer token (prevents API abuse)
- Shared JWT utility in `artifacts/api-server/src/lib/jwt.ts` — all routes use `verifyToken()` / `signToken()` / `hashPassword()`
- No hardcoded secrets in source code; all keys via env vars
- Demo credentials: `admin@demo.com / demo123`, `farmer@demo.com / demo123`, etc.

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo.com | demo123 |
| Farmer | farmer@demo.com | demo123 |
| Student | student@demo.com | demo123 |
| Buyer | buyer@demo.com | demo123 |
| Seller | seller@demo.com | demo123 |

## AI Integration

- **Hybrid endpoint** (`/api/ai/hybrid`): OpenRouter → OpenAI → local keyword tips → fallback strings
- **Image generation** (`/api/admin/generate-image`, `/api/ai/generate-image`): DALL-E 3 via OpenAI → Picsum placeholder
- **Video generation** (`/api/admin/generate-video`, `/api/ai/generate-video`): SISIF.AI polling → placeholder MP4
- **Section-aware**: Each admin tab and user page has its own system prompt

## Deployment (Render)

See `render.yaml` at root. Single combined service:
1. Builds frontend (Vite, BASE_PATH=/) and API (esbuild)
2. Copies frontend dist into `artifacts/api-server/public/`
3. Starts Express server which serves API + static frontend
4. Required env vars: `DATABASE_URL`, `JWT_SECRET`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`

## Wallpaper

`artifacts/samanyanga/public/graduation.webp` — applied as subtle background (10% opacity) across all pages via `index.css` body::before pseudo-element.
