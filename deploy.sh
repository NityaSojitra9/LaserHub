#!/usr/bin/env bash
# deploy.sh — Rebuild frontend, restart serve + uvicorn. Does NOT touch cloudflared.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== LaserHub deploy $(date '+%Y-%m-%d %H:%M:%S') ==="

# 1. Rebuild frontend
echo "[1/3] Building frontend..."
cd frontend
npm run build 2>&1 | tail -10
cd "$SCRIPT_DIR"
echo "  -> Frontend build complete."

# 2. Restart static file server (serve)
echo "[2/3] Restarting static file server..."
# Kill any existing serve process serving our frontend dist
pkill -f "serve.*frontend/dist" 2>/dev/null || true
sleep 0.5
nohup serve -s frontend/dist -l 3000 > /tmp/laserhub-serve.log 2>&1 &
echo "  -> serve started on port 3000 (pid $!)"

# 3. Restart backend (uvicorn)
echo "[3/3] Restarting backend..."
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 0.5
cd backend
nohup python3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/laserhub-uvicorn.log 2>&1 &
echo "  -> uvicorn started on port 8000 (pid $!)"

cd "$SCRIPT_DIR"
echo "=== Deploy complete ==="
