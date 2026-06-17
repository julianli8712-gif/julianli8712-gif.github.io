# CLAUDE.md — WinePair

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Shared infrastructure** (server, Nginx, SSL, ICP, deployment gotchas) → see root `CLAUDE.md`. This file covers WinePair-specific architecture, AI, database, operations, and roadmap.

## WinePair Architecture

- **Frontend**: React 18 + Vite + MUI 6 + Tailwind, built to `/www/wwwroot/winepair/`
- **Backend**: Express 4 + Prisma 6 + Supabase PostgreSQL, PM2 at `/opt/winepair/server/`
- **AI**: DashScope qwen3.6-flash (enable_thinking: false, 4s timeout, ~2.6s avg response)
- **Auth**: JWT access_token (15min) + refresh_token (7d), bcryptjs
- **RBAC**: admin / manager / waiter roles
- **i18n**: zh-CN / en, country chips follow system language
- **PWA**: Service worker with offline support
- **DB**: Supabase PostgreSQL (free tier), connection pooler required. Never local SQLite.
- **SSL**: Let's Encrypt via certbot, auto-renewal daily at 3am
- **Pairing exam score**: 99/100

## Guest Features

- **GuestHome**: 2×2 grid (Browse row: Prego Menu + Wine List on top; AI row: Dish→Wine + Wine→Dish below)
- **Prego Menu** — Browse dishes by category (上菜顺序), with Chef Tony tasting notes + sommelier wine suggestions
- **Prego Wine List** — Browse wines by country→type→glass, glass-only toggle, with sommelier tasting notes + chef dish suggestions
- **AI Dish→Wine / Wine→Dish** — Multi-select, country chips, grouped layout matching Wine List
- **Three pairing modes**: Classic (🍷 must be by-glass) / Bold (🔥 contrast) / Surprise (✨ terroir story)
- **Result cards**: Image thumbnails with mode subtitles, guest-facing `reason`, "您的专属推荐"
- **Bottom action bar**: Fixed bar with clear-all + selected count + recommend button
- **SommelierThinking**: 3-step animation (1s/step), synced with ~3s AI response

## Waiter Features

- **WaiterPanel** (`/waiter`): Search-first layout with uniform 80×80 image cards
- **Product tip library**: Tap any dish/wine → centered dialog (maxWidth sm) with 380px image + 🍷 sales_tip
- **AI recommend**: Multi-select items → full-screen result view with server_tip directly readable
- **server_tip vs reason**: Guest sees pairing reason, waiter sees selling script (role-isolated)
- **149 AI-generated sales tips** across all dishes (56) and wines (98), stored as `sales_tip` field
- **Bottom bar**: Slide-in with collapsible customer note, recommend button, item count

## Analytics

- **Tracking**: dish_detail_open, wine_detail_open (glass/bottle split), recommend_start/result/vote funnel
- **Dashboard**: Embedded in admin home, Apple-style cards, time range (today/7d/30d), top 5 dishes/wines
- **API**: `POST /api/analytics/event` (fire-and-forget), `GET /api/analytics/dashboard` (admin auth)

## Post-Validation Rules (recommendations.ts)

1. Heavy meat (和牛/战斧/肋排) + white/rosé → auto-replace with red
2. Dessert (提拉米苏/巧克力/焦糖/布丁) + dry sparkling → auto-replace with sweet/fortified
3. Seafood soup + red → auto-replace with white
4. Raw fish (三文鱼/金枪鱼/carpaccio) + non-light red (not Pinot Noir/Gamay) → replace with white/sparkling
5. Dedup by dish name, fill to 3 items
6. AI reason correction: red wine selected but reason mentions white → auto-fix (and vice versa)
7. Glass wine enforcement: position 1 (classic mode) MUST be by-glass — changed from "exactly 1" to "first must be glass"

## Deployment

```bash
# Build frontend
cd client && npx vite build && tar czf /tmp/winepair-dist.tar.gz -C dist .

# Package server (NO node_modules)
tar czf /tmp/winepair-server.tar.gz --exclude='node_modules' --exclude='data' --exclude='.env' --exclude='.git' server

# Upload & deploy
scp /tmp/winepair-dist.tar.gz /tmp/winepair-server.tar.gz root@47.99.139.95:/tmp/
ssh root@47.99.139.95 << 'EOF'
  rm -f /www/wwwroot/winepair/index.html
  rm -rf /www/wwwroot/winepair/assets
  tar xzf /tmp/winepair-dist.tar.gz -C /www/wwwroot/winepair/
  find /www/wwwroot/winepair/ -type f -exec chmod 644 {} +       # fix macOS tar permissions
  find /www/wwwroot/winepair/ -type d -exec chmod 755 {} +
  rm -rf /opt/winepair/server/src /opt/winepair/server/prisma /opt/winepair/server/package.json
  tar xzf /tmp/winepair-server.tar.gz -C /opt/winepair/
  cd /opt/winepair/server && npm install --omit=dev && npx prisma generate
  pm2 restart winepair && pm2 save && nginx -s reload
EOF
```

## WinePair Login

- admin / admin123
- Email auto-appends @winepair.local

## Supabase Connection

- Project ref: `oyhcntyconvdekxaaphm`, ap-southeast-1
- Use pooler (port 6543, `?pgbouncer=true`)
- `.env` at `/opt/winepair/server/.env` (never commit)

## Operational Safeguards (2026-05-28)

### Database Backup
- **Script**: `server/scripts/backup-export.ts` — exports all 9 tables as JSON
- **Cron**: daily at 4am, cleanup at 5am (keep 7 days)
- **Location**: `/opt/winepair/backups/backup-YYYY-MM-DDTHH-mm-ss/`
- **Known issue**: `__dirname` in ESM resolves to `src/` path; redirect manually if needed

### Error Monitoring (Sentry)
- **DSN**: `https://529b7240f...@o4511467232428032.ingest.us.sentry.io/4511467263229952`
- **Setup**: `instrument.mjs` (pure JS, NOT tsx) loaded via `--import` flag
- **Critical**: Must use `.mjs` + `--import` — tsx + TypeScript + IITM are incompatible
- **Error response**: includes `requestId` (UUID) + `sentryEventId` (Sentry event ID)

### Rate Limiting
| Limiter | Scope | Limit |
|---------|-------|-------|
| `globalLimiter` | All routes | 100 req/min/IP |
| `authLimiter` | `/api/auth/*` | 5 req/min/IP |
| `aiLimiter` | `/api/recommendations/*` | 10 req/min/IP |
| `importLimiter` | `/api/import/*` | 5 req/min/IP |

### PM2 Configuration
- **Start command**: `pm2 start "npx tsx --import /opt/winepair/server/src/instrument.mjs src/index.ts" --name winepair --cwd /opt/winepair/server`
- **Logrotate**: 10MB per file, retain 30 days, compression enabled
- **Warning**: PM2 runs its own command, NOT package.json scripts. Changes to npm scripts don't auto-apply.

### Request Tracing
- Every request gets a UUID via middleware (`server/src/index.ts:28`)
- Error responses include both `requestId` and `sentryEventId`

## Common Pitfalls

1. **qwen3.6+ models** — need `enable_thinking: false` or will timeout (>10s)
2. **Qwen3.x Flash models** work on OpenAI-compatible API; DeepSeek models require native API
3. **No `--strip-components`** on frontend tar
4. **Sentry + tsx + ESM**: Must use `.mjs` instrument file + `--import` flag. TypeScript instrument file won't work.
5. **PM2 ignores npm scripts**: PM2 runs its own command string. After changing `package.json` scripts, must `pm2 delete` + `pm2 start` to update.
6. **.env trailing newline**: Always ensure `.env` ends with a newline. `echo >>` appends without one, breaking dotenv parsing.

## Key Files

| File | Role |
|------|------|
| `server/src/services/qwenService.ts` | AI model, system prompt, timeout, thinking mode |
| `server/src/routes/recommendations.ts` | Pairing rules, post-validation, reason correction |
| `server/src/services/ruleEngine.ts` | Fallback rule engine |
| `server/src/middleware/security.ts` | Rate limiters (global, auth, AI, import) + helmet + HTTPS redirect |
| `server/src/middleware/errorHandler.ts` | Global error handler, Sentry capture, requestId + sentryEventId |
| `server/src/middleware/sentry.ts` | Sentry Express error handler setup |
| `server/src/instrument.mjs` | Sentry init (pure JS, loaded before Express via --import) |
| `server/scripts/backup-export.ts` | Database backup: exports all 9 tables as JSON |
| `client/src/types/sommelierRules.ts` | Frontend pairing maps, tasting templates, country i18n |
| `client/src/components/guest/WineList.tsx` | Prego Wine List (browse) |
| `client/src/components/guest/DishMenu.tsx` | Prego Menu (browse) |
| `client/src/components/guest/WineSelector.tsx` | AI wine selection (matches WineList layout) |
| `client/src/components/guest/DishSelector.tsx` | AI dish selection |
| `client/src/components/guest/GuestHome.tsx` | Guest landing (2×2 grid) |
| `client/src/components/SommelierThinking.tsx` | AI loading animation |
| `client/src/components/waiter/WaiterPanel.tsx` | Waiter panel: search + tip library + AI recommend |
| `client/src/components/admin/AnalyticsPanel.tsx` | Apple-style analytics dashboard |
| `client/src/components/guest/RecommendationResult.tsx` | Guest recommendation cards (3 modes + voting) |
| `client/src/services/analytics.ts` | Fire-and-forget event tracking |
| `server/src/routes/analytics.ts` | Analytics event ingest + dashboard API |

## Optimization Roadmap

### Phase 1: Foundation ✅
- [x] ICP filing + SSL certificates
- [x] Model speed (qwen3.6-flash, ~2.6s)
- [x] Pairing quality (99/100 exam score)
- [x] Guest browsing (Prego Menu + Wine List)
- [x] UI consistency (country i18n, layout alignment)
- [x] 155 AI tasting notes (dishes + wines)

### Phase 2: Operational Safeguards ✅ (2026-05-28)
- [x] Database auto-backup (daily 4am, 7-day rotation)
- [x] Sentry error monitoring (ESM auto-instrumentation)
- [x] API rate limiting (AI 10/min, import 5/min)
- [x] PM2 log rotation (10MB/30d)
- [x] Request tracing (UUID + sentryEventId)

### Phase 3: Real-World Validation (current)
- [x] Usage analytics — dish/wine detail tracking, AI funnel, Apple-style dashboard
- [x] AI recommendation UX — three pairing modes, mode labels, result card images
- [x] Waiter panel — search-first tip library with 149 AI-generated sales tips
- [ ] Restaurant field testing — collect guest + staff feedback
- [ ] AI recommendation accuracy — spot-check real recommendations
- [ ] Performance under load — multiple tables simultaneously

### Phase 4: Product Polish (in progress)
- [x] Recommendation result cards with images and mode subtitles
- [ ] FOH staff experience — waiter panel real-world feedback
- [ ] Skeleton screens for cold-load states
- [ ] Offline mode hardening (PWA)
- [ ] Tasting note human review pass
- [ ] Mobile UX polish

### Phase 5: Growth (future)
- [ ] Multi-restaurant support (schema ready, needs UI)
- [ ] Chinese cuisine pairing knowledge graph
- [ ] Wine inventory management
- [ ] Guest preference learning
- [ ] WeChat Mini Program version
