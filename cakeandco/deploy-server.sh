#!/bin/bash
# Cake & Co. Server Deploy Script
# Uploads server source, installs deps, regenerates Prisma client, restarts PM2.

set -e

SERVER_DIR="$(cd "$(dirname "$0")/server" && pwd)"
REMOTE="root@47.99.139.95"
APP="/opt/cakeandco"

echo "🍰 Cake & Co. Server Deploy"
echo "=========================="

# 1. Package server source
echo "[1/4] Packaging server source..."
cd "$SERVER_DIR"
tar czf /tmp/cakeandco-server.tar.gz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='dist' \
  src/ prisma/ package.json tsconfig.json

# 2. Upload
echo "[2/4] Uploading..."
scp /tmp/cakeandco-server.tar.gz "$REMOTE:/tmp/"

# 3. Install + generate + restart
echo "[3/4] Installing and generating..."
ssh "$REMOTE" "\
  cd $APP && \
  tar xzf /tmp/cakeandco-server.tar.gz && \
  npm install --omit=dev && \
  npx prisma generate && \
  pm2 restart cakeandco && \
  rm /tmp/cakeandco-server.tar.gz && \
  echo 'Server deployed OK' \
"

# Cleanup local temp
rm -f /tmp/cakeandco-server.tar.gz

# 4. Health check
echo "[4/4] Health check..."
sleep 2
curl -s "https://cakeandco.julianli.net/cake-api/health" | python3 -m json.tool 2>/dev/null || \
  echo "⚠️  Health check failed — check PM2 logs: ssh $REMOTE 'pm2 logs cakeandco'"

echo ""
echo "✅ Server deployed to https://cakeandco.julianli.net"
