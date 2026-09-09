#!/bin/bash
# Cake & Co. Client Deploy Script
# Builds the PWA client and deploys to production, preserving the img symlink.

set -e

CLIENT_DIR="$(cd "$(dirname "$0")/client" && pwd)"
REMOTE="root@47.99.139.95"
WWW="/www/wwwroot/cakeandco"

echo "🍰 Cake & Co. Client Deploy"
echo "=========================="

# 1. Build
echo "[1/4] Building client..."
cd "$CLIENT_DIR"
npm run build

# 2. Package
echo "[2/4] Packaging..."
cd dist
tar czf /tmp/cakeandco-client.tar.gz .

# 3. Upload
echo "[3/4] Uploading..."
scp /tmp/cakeandco-client.tar.gz "$REMOTE:/tmp/"

# 4. Deploy (precise deletion preserves img symlink)
echo "[4/4] Deploying..."
ssh "$REMOTE" "\
  cd $WWW && \
  rm -rf assets index.html icon.svg manifest.webmanifest registerSW.js sw.js workbox-*.js scenes placeholder-cake.svg && \
  tar xzf /tmp/cakeandco-client.tar.gz && \
  chmod -R 755 . && \
  rm /tmp/cakeandco-client.tar.gz && \
  echo 'Client deployed OK' \
"

# Cleanup local temp
rm -f /tmp/cakeandco-client.tar.gz

echo ""
echo "✅ Client deployed to https://cakeandco.julianli.net"
