#!/bin/bash
# LaserHub startup script
# Starts backend (uvicorn), frontend (Vite dev with HMR), and Cloudflare tunnel
# Usage: ./start.sh [--build]
#   Default: runs Vite dev server on :5173 (hot reload, fast)
#   --build: builds frontend and serves via npx serve (simulates production)

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

MODE="dev"
if [[ "$1" == "--build" ]]; then
    MODE="build"
fi

echo "🚀 Starting LaserHub (mode: $MODE)..."

# Kill existing processes
echo "🔄 Stopping existing services..."
pkill -f "uvicorn app.main" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "serve.*dist" 2>/dev/null || true
pkill -f "cloudflared tunnel" 2>/dev/null || true
sleep 2

# Start backend
echo "🐍 Starting backend on :8000..."
cd "$SCRIPT_DIR/backend"
nohup python3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > /tmp/laserhub-backend.log 2>&1 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

# Start frontend
if [[ "$MODE" == "build" ]]; then
    echo "📦 Building frontend..."
    cd "$SCRIPT_DIR/frontend" && npm run build
    echo "⚛️  Starting static server on :5173..."
    nohup npx serve "$SCRIPT_DIR/frontend/dist" -p 5173 -s > /tmp/laserhub-static.log 2>&1 &
    FRONTEND_PID=$!
    FRONTEND_LOG="/tmp/laserhub-static.log"
else
    echo "⚛️  Starting Vite dev server on :5173 (HMR enabled)..."
    cd "$SCRIPT_DIR/frontend"
    nohup npx vite --host 0.0.0.0 --port 5173 > /tmp/laserhub-vite.log 2>&1 &
    FRONTEND_PID=$!
    FRONTEND_LOG="/tmp/laserhub-vite.log"
fi
echo "  Frontend PID: $FRONTEND_PID"

# Start Cloudflare tunnel
echo "🌐 Starting Cloudflare tunnel..."
nohup ~/.local/bin/cloudflared tunnel --config ~/.cloudflared/laserhub-config.yml run > /tmp/laserhub-tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "  Tunnel PID: $TUNNEL_PID"

# Wait for services to come up (Vite dev needs a moment to compile)
sleep 6

# Health check
echo ""
echo "🔍 Health checks:"
curl -s http://localhost:8000/health 2>/dev/null | python3.13 -c "import sys,json; d=json.load(sys.stdin); print(f'  Backend: {d[\"status\"]}')" || echo "  Backend: DOWN"
curl -s -o /dev/null -w "  Frontend: HTTP %{http_code}\n" http://localhost:5173/
curl -s -o /dev/null -w "  Public:   HTTP %{http_code}\n" https://laserhub.hjlabs.in/

echo ""
echo "✅ LaserHub is running!"
echo "   Local:  http://localhost:5173  (Vite HMR — edits reload instantly)"
echo "   Public: https://laserhub.hjlabs.in"
echo ""
echo "Logs:"
echo "   Backend:  /tmp/laserhub-backend.log"
echo "   Frontend: $FRONTEND_LOG"
echo "   Tunnel:   /tmp/laserhub-tunnel.log"
