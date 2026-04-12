# Film Room

Film Room is a **league-first NFL football competition platform** for fantasy leagues, creator communities, and high-engagement fan groups. It turns weekly football talk into a structured game: **standings, head-to-head challenges, and Sunday live windows**—so groups can settle who actually knows ball.

This repository implements **Film Room V7** (product, company, and technical specs live in [`docs/`](docs/)).

---

## What Film Room is (V7)

- **Not** a generic trivia app, fantasy manager, or solo training product.
- **Is** the **competitive layer for groups that already exist**: fantasy leagues, Discord servers, creator audiences, and group chats.
- **Retention unit:** the **group** (not the isolated fan). **Activation unit:** the **commissioner** or **creator host**.
- Members play **weekly scenario sets**, challenge each other **head-to-head**, and compete during **Sunday live** windows; **standings** update across the NFL week.

Core loop in one line: *your group already debates football every week—Film Room turns that into a real game with rank, rivalry, and results.*

---

## Monorepo layout

| Path | Role |
|------|------|
| [`apps/api`](apps/api) | **Fastify** REST API (Node 20, TypeScript) |
| [`apps/mobile`](apps/mobile) | **Expo SDK 54** app — Expo Router, NativeWind, TanStack Query, Zustand |
| [`packages/types`](packages/types) | Shared **TypeScript** types and scoring constants |
| [`supabase/`](supabase) | **PostgreSQL** migrations, Supabase CLI config, seed hook |
| [`docs/`](docs) | Product and company specs (V5–V7), including technical bootstrap notes |

Root tooling: **npm workspaces** + **Turborepo** (`turbo run dev`, `build`, `lint`).

---

## Tech stack (V7 technical spec)

| Layer | Choice |
|-------|--------|
| Mobile | Expo (React Native), Expo Router, NativeWind, Zustand, TanStack Query |
| API | Fastify 4, Zod, JWT verification vs Supabase-issued tokens |
| Data | **Supabase** (Postgres, Auth, Realtime, Storage) |
| Payments | RevenueCat (League Pass / IAP) |
| Push | Expo + OneSignal |
| Jobs | Railway Cron → internal API routes |
| CI/CD | GitHub Actions + EAS + Railway (as rolled out) |

Environment variables: [`apps/api/.env.example`](apps/api/.env.example) (API), [`apps/mobile/.env.example`](apps/mobile/.env.example) (Expo `EXPO_PUBLIC_*`).

---

## Prerequisites

- **Node.js 20+** (see [`.nvmrc`](.nvmrc)) — required for Expo SDK 54 and the API toolchain
- **npm** 10+
- **Supabase** account and CLI (`npx supabase`) for migrations
- **Expo Go** on your phone (or Xcode / Android Studio) to run the mobile app

---

## Quick start (API)

```bash
cd filmroom
npm install
```

Create `apps/api/.env` from [`apps/api/.env.example`](apps/api/.env.example). You need at least `SUPABASE_JWT_SECRET` (and Supabase URL / service role key when calling the database).

```bash
npm run dev --workspace=@filmroom/api
curl http://localhost:3000/health
```

---

## Quick start (mobile)

```bash
cd filmroom
npm install
cp apps/mobile/.env.example apps/mobile/.env   # fill EXPO_PUBLIC_* from Supabase + API URL
npm run dev --workspace=@filmroom/mobile
```

Scan the QR code with **Expo Go**, or press `i` / `a` for simulator. You should see the **Film Room** home screen (NativeWind styling).

---

## Database

SQL migrations live under [`supabase/migrations/`](supabase/migrations) (V7 schema: users, leagues, scenarios, weekly challenges, H2H, Sunday windows, standings, League Pass, etc.). Apply to a linked project with:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

---

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/FILMROOM_V7_FUNDABLE_SPEC.md`](docs/FILMROOM_V7_FUNDABLE_SPEC.md) | Company thesis, GTM, content authority, economics |
| [`docs/FILMROOM_V7_TECHNICAL_SPEC.docx`](docs/FILMROOM_V7_TECHNICAL_SPEC.docx) | Stack, schema, API routes, mobile layout, bootstrap steps |
| [`docs/FILMROOM_V7_FUNCTIONAL_SPEC.docx`](docs/FILMROOM_V7_FUNCTIONAL_SPEC.docx) | Functional / product requirements (V7) |
| [`docs/FILMROOM_V5_PRODUCT_SPEC.md`](docs/FILMROOM_V5_PRODUCT_SPEC.md) | Earlier league-first product spec (historical context) |

---

## Status

Active development against the V7 technical plan: monorepo, API shell + auth, database migrations, and Expo mobile shell (tabs + NativeWind) are in place; auth routes and `lib/api.ts` wiring are next.

---

## Author

**Shaan Kalgaonkar** — Computer Science & Data Science, University of Wisconsin–Madison  
[GitHub](https://github.com/shaankal)
