#!/bin/bash
# Digital Sommelier Client Deploy Script
# Builds the PWA client and deploys to production.

set -e

CLIENT_DIR="$(cd "$(dirname "$0")/client" && pwd)"
REMOTE="root@47.99.139.95"
WWW="/www/wwwroot/barpair"

echo "🍷 Digital Sommelier Client Deploy"
echo "==================================="

# 1. Build
echo "[1/4] Building client..."
cd "$CLIENT_DIR"
npm install --silent
npm run build

# 2. Package
echo "[2/4] Packaging..."
cd dist
tar czf /tmp/barpair-client.tar.gz .

# 3. Upload
echo "[3/4] Uploading..."
scp /tmp/barpair-client.tar.gz "$REMOTE:/tmp/"

# 4. Deploy
echo "[4/4] Deploying..."
ssh "$REMOTE" "\
  mkdir -p $WWW && \
  cd $WWW && \
  rm -rf assets index.html icon.svg manifest.webmanifest registerSW.js sw.js workbox-*.js && \
  tar xzf /tmp/barpair-client.tar.gz && \
  chmod -R 755 . && \
  rm /tmp/barpair-client.tar.gz && \
  echo 'Client deployed OK' \
"

# Cleanup local temp
rm -f /tmp/barpair-client.tar.gz

echo ""
echo "✅ Client deployed to https://pair.julianli.net"
