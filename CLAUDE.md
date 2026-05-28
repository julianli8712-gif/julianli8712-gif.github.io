# CLAUDE.md — WinePair + Julian Li Personal Site

## Project Overview

Two sites on one Alibaba Cloud server (47.99.139.95):

| Site | Path | DNS | Status |
|------|------|-----|--------|
| Julian Li Personal Homepage | `/www/wwwroot/julianli/` | julianli.net, www.julianli.net | ✅ ICP已通过 + SSL |
| WinePair SaaS | `/www/wwwroot/winepair/` | winepair.julianli.net | ✅ ICP已通过 + SSL |

## Server

- **IP**: 47.99.139.95 (华东1杭州, 2vCPU 2GiB, 40GB, expiry 2027-05-21)
- **OS**: Alibaba Cloud Linux 3 (OpenAnolis Edition)
- **SSH**: `ssh root@47.99.139.95` (key installed)
- **Old server**: 121.199.3.210 (expires 2026-06-20, to be decommissioned)

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

## Nginx Config (current)

```
/etc/nginx/conf.d/julianli.conf:
  - julianli.net:443 → /www/wwwroot/julianli/ (personal homepage, default_server)
  - winepair.julianli.net:443 → /www/wwwroot/winepair/ (WinePair)
  - Port 80: HTTP→HTTPS redirect (with .txt bypass for WeChat verification)
  - Port 8080: WinePair backup (IP direct access, testing)
  - /api/ → proxy_pass 127.0.0.1:3000
```

## Guest Features

- **GuestHome**: 2×2 grid (Browse row: Prego Menu + Wine List on top; AI row: Dish→Wine + Wine→Dish below)
- **Prego Menu** — Browse dishes by category (上菜顺序), with Chef Tony tasting notes + sommelier wine suggestions
- **Prego Wine List** — Browse wines by country→type→glass, glass-only toggle, with sommelier tasting notes + chef dish suggestions
- **AI Dish→Wine / Wine→Dish** — Multi-select, country chips, grouped layout matching Wine List
- **Bottom action bar**: Fixed bar with clear-all + selected count + recommend button
- **SommelierThinking**: 3-step animation (1s/step), synced with ~3s AI response

## Post-Validation Rules (recommendations.ts)

1. Heavy meat (和牛/战斧/肋排) + white/rosé → auto-replace with red
2. Dessert (提拉米苏/巧克力/焦糖/布丁) + dry sparkling → auto-replace with sweet/fortified
3. Seafood soup + red → auto-replace with white
4. Raw fish (三文鱼/金枪鱼/carpaccio) + non-light red (not Pinot Noir/Gamay) → replace with white/sparkling
5. Dedup by dish name, fill to 3 items
6. AI reason correction: red wine selected but reason mentions white → auto-fix (and vice versa)
7. Glass wine enforcement: exactly 1 by-glass per recommendation

## Deployment

```bash
# Build frontend
cd client && npx vite build && tar czf /tmp/winepair-dist.tar.gz -C dist .

# Package server (NO node_modules)
tar czf /tmp/winepair-server.tar.gz --exclude='node_modules' --exclude='data' --exclude='.env' --exclude='.git' server

# Upload & deploy
scp /tmp/winepair-dist.tar.gz /tmp/winepair-server.tar.gz root@47.99.139.95:/tmp/
ssh root@47.99.139.95 << 'EOF'
  rm -rf /www/wwwroot/winepair/*
  tar xzf /tmp/winepair-dist.tar.gz -C /www/wwwroot/winepair/
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

## Common Pitfalls

1. **macOS tar on Linux**: `LIBARCHIVE.xattr.*` warnings are harmless
2. **Deploy tar MUST exclude .env** — contains Supabase credentials
3. **Deploy `rm -rf /www/wwwroot/winepair/*`** — deletes WeChat verification txt files; keep them in `client/public/`
4. **qwen3.6+ models** — need `enable_thinking: false` or will timeout (>10s)
5. **Qwen3.x Flash models** work on OpenAI-compatible API; DeepSeek models require native API
6. **No `--strip-components`** on frontend tar

## Key Files

| File | Role |
|------|------|
| `server/src/services/qwenService.ts` | AI model, system prompt, timeout, thinking mode |
| `server/src/routes/recommendations.ts` | Pairing rules, post-validation, reason correction |
| `server/src/services/ruleEngine.ts` | Fallback rule engine |
| `client/src/types/sommelierRules.ts` | Frontend pairing maps, tasting templates, country i18n |
| `client/src/components/guest/WineList.tsx` | Prego Wine List (browse) |
| `client/src/components/guest/DishMenu.tsx` | Prego Menu (browse) |
| `client/src/components/guest/WineSelector.tsx` | AI wine selection (matches WineList layout) |
| `client/src/components/guest/DishSelector.tsx` | AI dish selection |
| `client/src/components/guest/GuestHome.tsx` | Guest landing (2×2 grid) |
| `client/src/components/SommelierThinking.tsx` | AI loading animation |
