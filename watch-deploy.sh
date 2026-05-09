#!/usr/bin/env bash
# watch-deploy.sh — Watch frontend/src and backend/app for changes, then auto-deploy.
# Uses inotifywait if available, otherwise falls back to polling with find+stat.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY="$SCRIPT_DIR/deploy.sh"
WATCH_DIRS=("$SCRIPT_DIR/frontend/src" "$SCRIPT_DIR/backend/app")
DEBOUNCE_SEC=2

echo "=== LaserHub file watcher ==="
echo "Watching: ${WATCH_DIRS[*]}"
echo "Debounce: ${DEBOUNCE_SEC}s"
echo "Press Ctrl+C to stop."
echo ""

# --------------------------------------------------------------------------
# Strategy 1: inotifywait (preferred — instant, low CPU)
# --------------------------------------------------------------------------
if command -v inotifywait &>/dev/null; then
  echo "Using inotifywait for file watching."
  LAST_DEPLOY=0

  while true; do
    inotifywait -r -e modify,create,delete,move \
      --exclude '(node_modules|__pycache__|\.pyc$|\.git)' \
      "${WATCH_DIRS[@]}" 2>/dev/null

    NOW=$(date +%s)
    if (( NOW - LAST_DEPLOY < DEBOUNCE_SEC )); then
      echo "  (debounce — skipping)"
      continue
    fi
    LAST_DEPLOY=$NOW

    echo ""
    echo "Change detected — running deploy..."
    sleep "$DEBOUNCE_SEC"
    bash "$DEPLOY" || echo "!! Deploy failed, will retry on next change."
    echo ""
  done

else
  # --------------------------------------------------------------------------
  # Strategy 2: Polling fallback (works everywhere)
  # --------------------------------------------------------------------------
  echo "inotifywait not found — using polling fallback (checks every 3s)."
  POLL_INTERVAL=3

  get_fingerprint() {
    find "${WATCH_DIRS[@]}" \
      -not -path '*/node_modules/*' \
      -not -path '*/__pycache__/*' \
      -not -name '*.pyc' \
      -type f \
      -newer /tmp/.laserhub-watch-marker 2>/dev/null | head -1
  }

  # Create initial marker
  touch /tmp/.laserhub-watch-marker

  while true; do
    sleep "$POLL_INTERVAL"

    CHANGED=$(get_fingerprint)
    if [ -n "$CHANGED" ]; then
      echo ""
      echo "Change detected ($CHANGED) — deploying after ${DEBOUNCE_SEC}s debounce..."
      sleep "$DEBOUNCE_SEC"
      touch /tmp/.laserhub-watch-marker
      bash "$DEPLOY" || echo "!! Deploy failed, will retry on next change."
      echo ""
    fi
  done
fi
