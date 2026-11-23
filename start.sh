#!/usr/bin/env bash
# Joy Ministries — one command to run the whole thing.
#
#   ./start.sh          API + Expo tunnel (phone via Expo Go, web on the same URL)
#   ./start.sh --lan    API + Expo on the LAN (no tunnel, same Wi-Fi only)
#   ./start.sh --web    API + Expo web only (browser on this machine)
#   ./start.sh --stop   stop everything this script started
#
# Everything is idempotent: a port that is already serving is left alone.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/tmp/opencode"
mkdir -p "$LOG_DIR"

API_PORT=38799
METRO_PORT=8081
MYSQL_CONTAINER="joy-church-mysql"
MODE="tunnel"

for arg in "$@"; do
  case "$arg" in
    --lan) MODE="lan" ;;
    --web) MODE="web" ;;
    --stop) MODE="stop" ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

listening() { ss -lnt 2>/dev/null | awk '{print $4}' | grep -q ":$1\$"; }

stop_all() {
  echo "→ stopping"
  pkill -f "expo start" 2>/dev/null || true
  pkill -f "church-app/server.*src/index.js" 2>/dev/null || true
  pkill -f "node src/index.js" 2>/dev/null || true
  pkill -f "cloudflared tunnel --url http://localhost:$API_PORT" 2>/dev/null || true
  echo "  done"
}

if [ "$MODE" = "stop" ]; then stop_all; exit 0; fi

# ---------------------------------------------------------------- database
# The app reads server/.env. When DB_HOST points at the cPanel host the local
# container is not needed at all, so skip it rather than starting a database
# nothing connects to.
DB_HOST_ENV="$(grep -E '^DB_HOST=' "$ROOT/server/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'" || true)"
if [ -n "$DB_HOST_ENV" ] && [ "$DB_HOST_ENV" != "127.0.0.1" ] && [ "$DB_HOST_ENV" != "localhost" ]; then
  echo "  mysql   : remote ($DB_HOST_ENV) — local container skipped"
elif command -v docker >/dev/null 2>&1; then
  if ! docker ps --format '{{.Names}}' | grep -qx "$MYSQL_CONTAINER"; then
    echo "→ starting MySQL container ($MYSQL_CONTAINER)"
    docker start "$MYSQL_CONTAINER" >/dev/null 2>&1 || echo "  ! could not start $MYSQL_CONTAINER"
    for _ in $(seq 1 20); do listening 3306 && break; sleep 1; done
  fi
  listening 3306 && echo "  mysql   :3306 ready" || echo "  ! mysql not listening on 3306"
fi

# ---------------------------------------------------------------- API
if listening "$API_PORT"; then
  echo "  api     :$API_PORT already running"
else
  echo "→ starting API on :$API_PORT"
  ( cd "$ROOT/server" && setsid nohup node src/index.js > "$LOG_DIR/server.log" 2>&1 < /dev/null & )
  for _ in $(seq 1 25); do listening "$API_PORT" && break; sleep 1; done
  listening "$API_PORT" && echo "  api     :$API_PORT ready" || { echo "  ! API failed — see $LOG_DIR/server.log"; tail -20 "$LOG_DIR/server.log"; exit 1; }
fi

# A public API origin is needed by the phone and by PayFast callbacks.
if [ "$MODE" != "web" ] && [ "$MODE" != "lan" ]; then
  if ! pgrep -f "cloudflared tunnel --url http://localhost:$API_PORT" >/dev/null 2>&1; then
    echo "→ opening public API tunnel"
    ( setsid nohup cloudflared tunnel --url "http://localhost:$API_PORT" --no-autoupdate > "$LOG_DIR/cf-api.log" 2>&1 < /dev/null & )
    for _ in $(seq 1 25); do grep -qo 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG_DIR/cf-api.log" 2>/dev/null && break; sleep 1; done
  fi
  API_PUBLIC="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_DIR/cf-api.log" 2>/dev/null | head -1 || true)"
  if [ -n "$API_PUBLIC" ]; then
    echo "  api pub : $API_PUBLIC"
    # Keep the app and the PayFast return URLs on the live host.
    if ! grep -q "^EXPO_PUBLIC_API_BASE=$API_PUBLIC$" "$ROOT/app/.env" 2>/dev/null; then
      printf 'EXPO_PUBLIC_API_BASE=%s\n' "$API_PUBLIC" > "$ROOT/app/.env"
    fi
    sed -i "s|^PUBLIC_BASE_URL=.*|PUBLIC_BASE_URL=$API_PUBLIC|" "$ROOT/server/.env"
  fi
fi

# ---------------------------------------------------------------- Expo (native + web)
if listening "$METRO_PORT"; then
  echo "  metro   :$METRO_PORT already running"
else
  case "$MODE" in
    tunnel) EXPO_ARGS="--tunnel" ;;
    lan)    EXPO_ARGS="--lan" ;;
    web)    EXPO_ARGS="--web" ;;
  esac
  echo "→ starting Expo ($MODE)"
  ( cd "$ROOT/app" && EXPO_NO_TELEMETRY=1 setsid nohup npx expo start $EXPO_ARGS --port "$METRO_PORT" > "$LOG_DIR/expo.log" 2>&1 < /dev/null & )
  for _ in $(seq 1 60); do listening "$METRO_PORT" && break; sleep 1; done
fi

# ---------------------------------------------------------------- summary
# The tunnel host is printed a few seconds after Metro binds; give it a moment.
for _ in $(seq 1 30); do
  grep -qo 'https\?://[a-z0-9-]*\.on\.expo\.app' "$LOG_DIR/expo.log" 2>/dev/null && break
  sleep 1
done
EXPO_HOST="$(grep -oE 'https?://[a-z0-9-]+\.on\.expo\.app' "$LOG_DIR/expo.log" 2>/dev/null | head -1 | sed 's|^http://|https://|' || true)"

echo
echo "────────────────────────────────────────────────────────────"
echo " Joy Ministries"
echo "────────────────────────────────────────────────────────────"
[ -n "$EXPO_HOST" ] && echo "  web / phone : $EXPO_HOST"
[ -n "${API_PUBLIC:-}" ] && echo "  api         : $API_PUBLIC"
echo "  api local   : http://localhost:$API_PORT"
echo "  admin site  : ${API_PUBLIC:-http://localhost:$API_PORT}/admin"
echo "  health      : ${API_PUBLIC:-http://localhost:$API_PORT}/health"
echo "────────────────────────────────────────────────────────────"
echo "  admin login : admin@joyministries.co.za / JoyAdmin#2026"
echo "  logs        : $LOG_DIR/{server,expo,cf-api}.log"
echo "  stop        : ./start.sh --stop"
echo "────────────────────────────────────────────────────────────"
