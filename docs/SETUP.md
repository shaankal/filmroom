# Film Room — local setup (Supabase + API + mobile)

Follow this once, then use the quick-start commands at the bottom every time you develop.

## 1. Prerequisites

- **Node.js 20+** (`node -v`)
- **npm** 10+
- [Supabase](https://supabase.com) account (free tier is fine)
- **Expo Go** on your phone, or Xcode Simulator / Android emulator

## 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick a name, password, and region. Wait until the project is **Active**.

## 3. Get your keys (Dashboard → Project Settings)

Open **Project Settings → API** and copy:

| Dashboard field | Put in |
|-----------------|--------|
| **Project URL** | `SUPABASE_URL` (API) and `EXPO_PUBLIC_SUPABASE_URL` (mobile) |
| **anon public** key | `SUPABASE_ANON_KEY` (API) and `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mobile) |
| **service_role** key | `SUPABASE_SERVICE_ROLE_KEY` (API only — never in mobile) |

Open **Project Settings → API → JWT Settings** (or **JWT Secret**):

| Field | Put in |
|-------|--------|
| **JWT Secret** | `SUPABASE_JWT_SECRET` in `apps/api/.env` |

> The API verifies login tokens with `SUPABASE_JWT_SECRET`. If this is wrong, the app will 401 after login.

## 4. Apply database schema + seed

From the repo root:

```bash
cd /path/to/filmroom
npm install

npx supabase login          # once
npx supabase link --project-ref <YOUR_PROJECT_REF>
```

`YOUR_PROJECT_REF` is the ID in your project URL:  
`https://supabase.com/dashboard/project/<YOUR_PROJECT_REF>`.

```bash
npx supabase db push
```

Seed dev data (scenarios, weekly challenges, Sunday windows):

```bash
# If you use Supabase CLI seed hook:
npx supabase db reset   # only on a fresh/dev project — wipes data

# Or run SQL manually in Dashboard → SQL Editor:
# paste contents of supabase/seed.sql and run
```

## 5. Configure environment files

### API — `apps/api/.env`

```bash
cp apps/api/.env.example apps/api/.env
```

Fill in:

```env
PORT=3000
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret-from-dashboard

INTERNAL_CRON_SECRET=dev-cron-secret-change-me
LEAGUE_PASS_DEV_UNLOCK=true
```

### Mobile — `apps/mobile/.env`

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:3000
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Physical device (Expo Go):** set `EXPO_PUBLIC_API_URL` to your Mac’s LAN IP, e.g. `http://192.168.1.42:3000`, not `localhost`.

Find LAN IP:

```bash
ipconfig getifaddr en0
```

## 6. Run locally

**Terminal 1 — API**

```bash
npm run dev --workspace=@filmroom/api
curl http://localhost:3000/health
```

**Terminal 2 — mobile**

```bash
npm run dev --workspace=@filmroom/mobile
```

Scan the QR code with Expo Go, or press `i` for iOS Simulator.

## 7. Test flow in the app

1. **Register** a new account (email + username + password).
2. **League** tab → create a league (or join with invite code from another account).
3. **Home** → **Play This Week's Challenge** → finish scenarios → **Results**.
4. **League** tab → tap a member → send **H2H** → **Challenge** tab → **Accept & play** (second account helps).
5. **Sunday Live** card when seed window is open (see `supabase/seed.sql`).
6. **Profile** tab → standings + rivalries.

## 8. Optional: cron-style jobs (local)

```bash
export SECRET=dev-cron-secret-change-me   # same as INTERNAL_CRON_SECRET

curl -X POST http://localhost:3000/internal/weekly/lock \
  -H "x-cron-secret: $SECRET" -H "Content-Type: application/json" -d '{}'
```

## 9. UI reference

Static mockups: open `docs/filmroom_ui_mockups.html` in a browser.  
The mobile app tabs (**Home · League · Challenge · Profile**) follow that layout.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login works but API returns 401 | Wrong `SUPABASE_JWT_SECRET` in `apps/api/.env` |
| Mobile “network request failed” | Fix `EXPO_PUBLIC_API_URL` (LAN IP on device) |
| No weekly challenge | Run `supabase/seed.sql` after creating a league |
| Expo `ReadableStream` error | Use Node 20+: `nvm use` or install from [nodejs.org](https://nodejs.org) |
