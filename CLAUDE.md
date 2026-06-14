# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Shared Infrastructure

Two sites on one Alibaba Cloud server:

| Site | Server Path | Domain |
|------|-------------|--------|
| Personal Homepage | `/www/wwwroot/julianli/` | julianli.net, www.julianli.net |
| WinePair | `/www/wwwroot/winepair/` | winepair.julianli.net |

- **Server**: 47.99.139.95 (华东1杭州, 2vCPU 2GiB, 40GB, expiry 2027-05-21), Alibaba Cloud Linux 3
- **SSH**: `ssh root@47.99.139.95` (key installed)
- **SSL**: Let's Encrypt via certbot, auto-renewal daily at 3am
- **ICP**: 京ICP备2022005355号 / 京公网安备11010502061016号

### Nginx (`/etc/nginx/conf.d/julianli.conf`)
- `julianli.net:443` → `/www/wwwroot/julianli/` (default_server)
- `winepair.julianli.net:443` → `/www/wwwroot/winepair/`
- Port 80 → HTTPS redirect (`.txt` bypass for WeChat verification)
- `/api/chat` → `proxy_pass 127.0.0.1:3001` (personal site AI assistant)
- `/api/` → `proxy_pass 127.0.0.1:3000` (WinePair backend)

### Shared Deployment Gotchas
- **macOS tar on Linux**: `LIBARCHIVE.xattr.*` warnings harmless; always `chmod 644/755` after extract
- **Deploy tar MUST exclude `.env`** — contains credentials
- **WeChat .txt files**: keep in project source (deploy `rm -rf` wipes them)

## Personal Site

Single-page site with embedded AI chat assistant.

| File | Role |
|------|------|
| `index.html` | Full page: hero, appointments, footer, AI chat UI (inline) |
| `style.css` | All styles |
| `server/index.js` | Express API server — `/api/chat` endpoint, DashScope qwen-plus, SSE streaming |
| `备案图标.png` | ICP footer icon |
| `CNAME` | Custom domain record |

### Deploy (personal site only)
```bash
scp index.html style.css 备案图标.png root@47.99.139.95:/www/wwwroot/julianli/
scp server/index.js root@47.99.139.95:/opt/julianli-server/
ssh root@47.99.139.95 "pm2 restart julianli-server && nginx -s reload"
```

### Local Dev
```bash
cd server
echo 'DASHSCOPE_API_KEY=sk-...' > .env   # get key from production /opt/julianli-server/.env
npm install && npm start                   # runs on port 3000 by default
```
No build step — personal site is static HTML/CSS/JS served directly.

### AI Chat Backend
- **Model**: DashScope qwen-plus (via OpenAI-compatible SDK, `dashscope.aliyuncs.com/compatible-mode/v1`)
- **System prompt**: DashScope compatible-mode rejects `system` role — resolved by prepending to first user message with server-side language detection (`IMPORTANT: Reply in English.` or `用中文回复。`)
- **SSE streaming**: Nginx MUST have `proxy_buffering off;` on `/api/chat` location, otherwise responses arrive all at once
- **Rate limit**: 15 req/min/IP via `X-Real-IP` header (Nginx sets it), 4000 char cap per message
- **Timeout**: 15s abort controller on API calls
- **PM2**: `pm2 start index.js --name julianli-server` (port 3001 on production, separate from WinePair on 3000)
- **API key**: `DASHSCOPE_API_KEY` in `.env`, separate from WinePair's key

---

> **WinePair development**: `cd winepair` — that directory has its own CLAUDE.md with full WinePair architecture, AI services, database, deployment, and roadmap.
