#!/usr/bin/env bash
# Simple uptime checker — run via cron every 5 minutes
# Usage: ./uptime-check.sh [WEBHOOK_URL]

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:8000/health}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173/}"
PUBLIC_URL="${PUBLIC_URL:-https://laserhub.hjlabs.in/health}"
WEBHOOK="${1:-$SLACK_WEBHOOK}"

check() {
  local name=$1 url=$2
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
  if [[ "$code" != "200" ]]; then
    echo "[DOWN] $name ($url) → $code"
    [[ -n "$WEBHOOK" ]] && curl -s -X POST -H "Content-Type: application/json" \
      -d "{\"text\":\"🔴 LaserHub $name is DOWN: $url returned $code\"}" "$WEBHOOK" > /dev/null
    return 1
  fi
  echo "[OK]   $name ($url)"
}

check "Backend"  "$BACKEND_URL"
check "Frontend" "$FRONTEND_URL"
check "Public"   "$PUBLIC_URL"
