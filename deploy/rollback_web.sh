#!/usr/bin/env bash
# Roll back to the previous release.
# Usage: sudo ./rollback_web.sh [--restore-db <backup-file>]
# Must be run as root on the VPS.
set -Eeuo pipefail

# ─── Paths ────────────────────────────────────────────────────────────────────

BASE_DIR="/opt/swarm56/web"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"
PREVIOUS_LINK="$BASE_DIR/previous"
SERVICE="swarm56-web.service"
DB_FILE="/var/lib/swarm56/web/site.db"

# ─── Args ─────────────────────────────────────────────────────────────────────

RESTORE_DB_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --restore-db)
      RESTORE_DB_FILE="$2"
      shift 2
      ;;
    *)
      echo "ERROR: unknown argument $1"; exit 1
      ;;
  esac
done

# ─── 1. Root check ────────────────────────────────────────────────────────────

[[ "$(id -u)" -eq 0 ]] || { echo "ERROR: must run as root (use sudo)"; exit 1; }

log() { echo "[$(date '+%H:%M:%S')] $*"; }

check_health() {
  local url="$1"
  local health
  health=$(curl --fail --silent "$url") || { log "ERROR: Health endpoint unreachable: $url"; return 1; }
  local status db
  status=$(echo "$health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))")
  db=$(echo "$health" | python3 -c "import sys,json; print(json.load(sys.stdin).get('db',''))")
  [[ "$status" == "ok" ]] || { log "ERROR: health status='$status' (expected 'ok')"; return 1; }
  [[ "$db" == "ok" ]]     || { log "ERROR: health db='$db' (expected 'ok')"; return 1; }
  log "  Health: { status: $status, db: $db } ✅"
}

# ─── 2. Identify releases ─────────────────────────────────────────────────────

[[ -L "$CURRENT_LINK" ]] || { log "ERROR: $CURRENT_LINK symlink does not exist"; exit 1; }
[[ -L "$PREVIOUS_LINK" ]] || { log "ERROR: $PREVIOUS_LINK symlink does not exist (no previous release)"; exit 1; }

CURRENT_RELEASE=$(basename "$(readlink "$CURRENT_LINK")")
PREVIOUS_RELEASE=$(basename "$(readlink "$PREVIOUS_LINK")")

log "Current  release: $CURRENT_RELEASE"
log "Previous release: $PREVIOUS_RELEASE"

[[ "$CURRENT_RELEASE" != "$PREVIOUS_RELEASE" ]] \
  || { log "ERROR: current and previous releases are the same ($CURRENT_RELEASE)"; exit 1; }

[[ -d "$RELEASES_DIR/$PREVIOUS_RELEASE" ]] \
  || { log "ERROR: previous release directory not found: $RELEASES_DIR/$PREVIOUS_RELEASE"; exit 1; }

# ─── 3. Optional DB restore ───────────────────────────────────────────────────

if [[ -n "$RESTORE_DB_FILE" ]]; then
  [[ -f "$RESTORE_DB_FILE" ]] \
    || { log "ERROR: backup file not found: $RESTORE_DB_FILE"; exit 1; }

  log "WARNING: --restore-db will OVERWRITE the current production DB."
  log "  Current DB : $DB_FILE"
  log "  Restore from: $RESTORE_DB_FILE"
  read -r -p "Confirm DB restore? Type YES to proceed: " CONFIRM
  [[ "$CONFIRM" == "YES" ]] || { log "Aborted by user."; exit 1; }
fi

# ─── 4. Stop service ─────────────────────────────────────────────────────────

log "Stopping service..."
systemctl stop "$SERVICE" 2>/dev/null || true
sleep 1

# ─── 5. Restore DB if requested ───────────────────────────────────────────────

if [[ -n "$RESTORE_DB_FILE" ]]; then
  log "Restoring DB from $RESTORE_DB_FILE ..."
  cp --backup=numbered "$RESTORE_DB_FILE" "$DB_FILE"
  chown swarm56-web:swarm56-web "$DB_FILE"
  log "DB restored ✅"
fi

# ─── 6. Atomic symlink swap ──────────────────────────────────────────────────

log "Switching to previous release: $PREVIOUS_RELEASE ..."
ln -sfn "$RELEASES_DIR/$PREVIOUS_RELEASE" "${CURRENT_LINK}.tmp"
mv -Tf "${CURRENT_LINK}.tmp" "$CURRENT_LINK"
log "Symlink updated ✅"

# ─── 7. Start service ────────────────────────────────────────────────────────

log "Starting service..."
systemctl start "$SERVICE"
sleep 3

if ! systemctl is-active --quiet "$SERVICE"; then
  log "ERROR: service failed to start after rollback"
  exit 1
fi
log "Service started ✅"

# ─── 8. Health verification ──────────────────────────────────────────────────

log "Verifying health..."
sleep 2

curl --fail --silent http://127.0.0.1:3000/ > /dev/null \
  || { log "ERROR: homepage not responding after rollback"; exit 1; }
log "Homepage: 200 ✅"

check_health "http://127.0.0.1:3000/api/health"

# ─── Done ────────────────────────────────────────────────────────────────────

log ""
log "╔══════════════════════════════════╗"
log "║  Rollback complete ✅            ║"
log "╠══════════════════════════════════╣"
log "║  Reverted to : $PREVIOUS_RELEASE"
log "║  Service     : $(systemctl is-active "$SERVICE")"
log "╚══════════════════════════════════╝"
log ""
log "NOTE: The failed release ($CURRENT_RELEASE) remains in $RELEASES_DIR."
log "      Remove it manually when no longer needed."
