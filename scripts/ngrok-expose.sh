#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  ngrok-expose.sh  –  Expose PQ Jobs ra internet qua ngrok
#
#  Cách dùng:
#    ./scripts/ngrok-expose.sh              # Tự detect ngrok URL
#    ./scripts/ngrok-expose.sh <URL>        # Dùng URL cụ thể
#    ./scripts/ngrok-expose.sh --stop       # Khôi phục về localhost
# ─────────────────────────────────────────────────────────────
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_ENV="$ROOT_DIR/backend/.env"
FRONTEND_ENV="$ROOT_DIR/web/.env"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}ℹ ${NC}$*"; }
success() { echo -e "${GREEN}✅ ${NC}$*"; }
warn()    { echo -e "${YELLOW}⚠️  ${NC}$*"; }
error()   { echo -e "${RED}❌ ${NC}$*"; }

# ── Backup .env files ──────────────────────────────────────────
backup_env() {
  for envfile in "$BACKEND_ENV" "$FRONTEND_ENV"; do
    local bak="${envfile}.local-backup"
    if [ ! -f "$bak" ]; then
      cp "$envfile" "$bak"
      info "Backup: $bak"
    fi
  done
}

# ── Restore .env files ────────────────────────────────────────
restore_env() {
  for envfile in "$BACKEND_ENV" "$FRONTEND_ENV"; do
    local bak="${envfile}.local-backup"
    if [ -f "$bak" ]; then
      cp "$bak" "$envfile"
      info "Restored: $envfile"
    fi
  done
}

# ── Update a key=value in a .env file ─────────────────────────
set_env() {
  local file="$1" key="$2" value="$3"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    # Use a different delimiter for sed since URL contains /
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

# ── Detect ngrok URL from local API ──────────────────────────
detect_ngrok_url() {
  if command -v curl &>/dev/null; then
    local url
    url=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null \
      | grep -oP '"public_url"\s*:\s*"https://[^"]+' \
      | head -1 \
      | sed 's/"public_url"\s*:\s*"//')
    if [ -n "$url" ]; then
      echo "$url"
      return 0
    fi
  fi
  return 1
}

# ── STOP mode: restore localhost ─────────────────────────────
if [ "${1:-}" = "--stop" ] || [ "${1:-}" = "stop" ]; then
  echo ""
  info "Khôi phục cấu hình localhost..."
  restore_env

  echo ""
  info "Restart PM2 services..."
  cd "$ROOT_DIR"
  pm2 restart backend frontend --update-env 2>/dev/null || true

  echo ""
  success "Đã khôi phục về localhost mode!"
  echo ""
  echo -e "  Frontend: ${CYAN}http://localhost:3001${NC}"
  echo -e "  Backend:  ${CYAN}http://localhost:3006${NC}"
  echo -e "  Gateway:  ${CYAN}http://localhost${NC} (nginx)"
  echo ""
  exit 0
fi

# ── START mode: configure for ngrok ──────────────────────────
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   🌍 PQ Jobs - Ngrok Internet Expose      ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
echo ""

# 1. Determine ngrok URL
NGROK_URL="${1:-}"

if [ -z "$NGROK_URL" ]; then
  info "Detecting ngrok URL from local API..."
  if NGROK_URL=$(detect_ngrok_url); then
    success "Detected: $NGROK_URL"
  else
    error "Không tìm thấy ngrok tunnel đang chạy!"
    echo ""
    echo "  Cách 1: Chạy ngrok trước rồi chạy lại script:"
    echo "    ngrok http 80"
    echo "    ./scripts/ngrok-expose.sh"
    echo ""
    echo "  Cách 2: Truyền URL trực tiếp:"
    echo "    ./scripts/ngrok-expose.sh https://abc-xyz.ngrok-free.dev"
    echo ""
    exit 1
  fi
fi

# Strip trailing slash
NGROK_URL="${NGROK_URL%/}"

echo ""
info "Ngrok URL: ${CYAN}${NGROK_URL}${NC}"

# 2. Backup current .env
backup_env

# 3. Update backend/.env
info "Cập nhật backend/.env..."
set_env "$BACKEND_ENV" "BETTER_AUTH_URL"       "\"${NGROK_URL}\""
set_env "$BACKEND_ENV" "FRONTEND_URL"          "\"${NGROK_URL}\""
set_env "$BACKEND_ENV" "GOOGLE_CALLBACK_URL"   "\"${NGROK_URL}/api/auth/callback/google\""
success "backend/.env ✓"

# 4. Update web/.env
info "Cập nhật web/.env..."
set_env "$FRONTEND_ENV" "NEXT_PUBLIC_API_URL"      ""
set_env "$FRONTEND_ENV" "NEXT_PUBLIC_REALTIME_URL"  ""
set_env "$FRONTEND_ENV" "NEXT_PUBLIC_SITE_URL"     "${NGROK_URL}"
success "web/.env ✓"

# 5. Reload nginx
info "Reload nginx..."
if sudo nginx -t 2>/dev/null; then
  sudo nginx -s reload
  success "Nginx reloaded ✓"
else
  warn "Nginx config test failed! Check: sudo nginx -t"
fi

# 6. Restart PM2 services
info "Restart PM2 services (backend + frontend)..."
cd "$ROOT_DIR"
pm2 restart backend frontend --update-env
success "PM2 restarted ✓"

# 7. Check if ngrok is pointing to port 80
NGROK_PID=$(pgrep -a ngrok 2>/dev/null || true)
if echo "$NGROK_PID" | grep -q "3001"; then
  echo ""
  warn "Ngrok đang expose port 3001 (frontend trực tiếp)!"
  warn "Cần đổi sang port 80 (nginx gateway) để backend cũng được expose:"
  echo ""
  echo -e "  ${YELLOW}1. Tắt ngrok hiện tại (Ctrl+C)${NC}"
  echo -e "  ${YELLOW}2. Chạy lại: ${CYAN}ngrok http 80${NC}"
  echo -e "  ${YELLOW}3. Chạy lại script này${NC}"
  echo ""
elif ! echo "$NGROK_PID" | grep -q "ngrok"; then
  warn "Ngrok chưa chạy! Chạy: ngrok http 80"
fi

# 8. Summary
echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
success "Cấu hình hoàn tất!"
echo ""
echo -e "  🌐 Public URL:  ${CYAN}${NGROK_URL}${NC}"
echo -e "  📡 Gateway:     nginx :80 → frontend :3001 + backend :3006"
echo ""
echo -e "  ${YELLOW}⚠️  Nhớ cập nhật Google Cloud Console:${NC}"
echo -e "     Authorized JavaScript origins:"
echo -e "       ${CYAN}${NGROK_URL}${NC}"
echo -e "     Authorized redirect URIs:"
echo -e "       ${CYAN}${NGROK_URL}/api/auth/callback/google${NC}"
echo ""
echo -e "  ${YELLOW}📌 Khi xong, khôi phục localhost:${NC}"
echo -e "     ${CYAN}./scripts/ngrok-expose.sh --stop${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo ""
