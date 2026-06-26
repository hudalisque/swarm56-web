#!/usr/bin/env bash
# Deploy a release artifact to the Ubuntu VPS.
# Usage: sudo ./deploy_web.sh /tmp/swarm56-web-<release-id>.tar.gz [--seed]
# Must be run as root on the VPS.
set -Eeuo pipefail

# ─── Paths ────────────────────────────────────────────────────────────────────

BASE_DIR="/opt/swarm56/web"
RELEASES_DIR="$BASE_DIR/releases"
CURRENT_LINK="$BASE_DIR/current"
PREVIOUS_LINK="$BASE_DIR/previous"
DB_DIR="/var/lib/swarm56/web"
BACKUP_DIR="/var/backups/swarm56/web"
ENV_FILE="/etc/swarm56/web.env"
SERVICE="swarm56-web.service"

# ─── Args ─────────────────────────────────────────────────────────────────────

ARTIFACT_PATH=""
RUN_SEED=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --seed) RUN_SEED=true; shift ;;
    --*)    echo "ERROR: unknown option $1"; exit 1 ;;
    *)
      if [[ -z "$ARTIFACT_PATH" ]]; then
        ARTIFACT_PATH="$1"
      else
        echo "ERROR: unexpected argument $1"; exit 1
      fi
      shift
      ;;
  esac
done

[[ -n "$ARTIFACT_PATH" ]] || { echo "ERROR: artifact path required"; exit 1; }
[[ -f "$ARTIFACT_PATH" ]] || { echo "ERROR: artifact not found: $ARTIFACT_PATH"; exit 1; }

# ─── 1. Root check ────────────────────────────────────────────────────────────

[[ "$(id -u)" -eq 0 ]] || { echo "ERROR: must run as root (use sudo)"; exit 1; }

# ─── Helpers ─────────────────────────────────────────────────────────────────

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

# ─── 2. Verify artifact ───────────────────────────────────────────────────────

log "Verifying artifact: $ARTIFACT_PATH"

ARTIFACT_NAME=$(basename "$ARTIFACT_PATH" .tar.gz)
# Extract release ID from filename: swarm56-web-<RELEASE_ID>
RELEASE_ID="${ARTIFACT_NAME#swarm56-web-}"

[[ "$RELEASE_ID" =~ ^[0-9]{8}T[0-9]{6}Z-.+$ ]] \
  || { log "ERROR: invalid release ID format: $RELEASE_ID"; exit 1; }

log "Release ID: $RELEASE_ID"

# ─── 3. Pre-flight checks ─────────────────────────────────────────────────────

log "Pre-flight checks..."

id swarm56-web &>/dev/null || { log "ERROR: user swarm56-web does not exist"; exit 1; }
[[ -d "$RELEASES_DIR" ]]   || { log "ERROR: $RELEASES_DIR does not exist"; exit 1; }
[[ -d "$DB_DIR" ]]         || { log "ERROR: $DB_DIR does not exist"; exit 1; }
[[ -d "$BACKUP_DIR" ]]     || { log "ERROR: $BACKUP_DIR does not exist"; exit 1; }
[[ -f "$ENV_FILE" ]]       || { log "ERROR: $ENV_FILE does not exist"; exit 1; }

command -v sqlite3 &>/dev/null \
  || { log "ERROR: sqlite3 not found. Install: apt install sqlite3"; exit 1; }
command -v python3 &>/dev/null \
  || { log "ERROR: python3 not found"; exit 1; }

# ─── 4. Extract and verify SHA-256 manifest ───────────────────────────────────

STAGING_DIR="$RELEASES_DIR/.staging-$$"
mkdir -p "$STAGING_DIR"

log "Extracting artifact..."
tar -xzf "$ARTIFACT_PATH" -C "$STAGING_DIR"

NEW_RELEASE_DIR="$STAGING_DIR/$RELEASE_ID"
[[ -d "$NEW_RELEASE_DIR" ]] \
  || { log "ERROR: expected directory $RELEASE_ID inside artifact"; exit 1; }

log "Verifying SHA-256 manifest..."
cd "$NEW_RELEASE_DIR"
sha256sum --check manifest/manifest.sha256 --quiet \
  || { log "ERROR: manifest verification failed"; exit 1; }
log "Manifest verified ✅"

# ─── 5. DB backup ────────────────────────────────────────────────────────────

DB_FILE="$DB_DIR/site.db"
if [[ -f "$DB_FILE" ]]; then
  log "Stopping service for DB backup..."
  systemctl stop "$SERVICE" 2>/dev/null || true

  TS=$(date -u '+%Y%m%dT%H%M%SZ')
  BACKUP_FILE="$BACKUP_DIR/site-${TS}.db"
  log "Backing up DB to $BACKUP_FILE ..."
  sqlite3 "$DB_FILE" ".backup '$BACKUP_FILE'" \
    || { log "ERROR: sqlite3 backup failed"; exit 1; }
  log "DB backup complete ✅"
else
  log "No existing DB, skipping backup"
fi

# ─── 6. Save previous release for rollback ────────────────────────────────────

PREVIOUS_RELEASE=""
if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS_RELEASE=$(basename "$(readlink "$CURRENT_LINK")")
  log "Previous release: $PREVIOUS_RELEASE"
fi

# ─── 7. Install release ───────────────────────────────────────────────────────

FINAL_RELEASE_DIR="$RELEASES_DIR/$RELEASE_ID"
log "Installing release to $FINAL_RELEASE_DIR ..."
mv "$NEW_RELEASE_DIR" "$FINAL_RELEASE_DIR"
rm -rf "$STAGING_DIR"

chown -R swarm56-web:swarm56-web "$FINAL_RELEASE_DIR"

# ─── 8. Migration ─────────────────────────────────────────────────────────────

log "Running database migration..."
# Load env file without logging it
set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

cd "$FINAL_RELEASE_DIR/migrator"
./node_modules/.bin/prisma migrate deploy \
  || { log "ERROR: migration failed. Aborting — current symlink not changed."; exit 1; }
log "Migration complete ✅"

# ─── 9. Optional seed ────────────────────────────────────────────────────────

if [[ "$RUN_SEED" == "true" ]]; then
  log "Running seed (--seed flag supplied)..."
  ./node_modules/.bin/prisma db seed \
    || { log "ERROR: seed failed"; exit 1; }
  log "Seed complete ✅"
fi

# ─── 10. Atomic symlink swap ─────────────────────────────────────────────────

log "Switching current symlink to $RELEASE_ID ..."
if [[ -L "$CURRENT_LINK" ]] && [[ -n "$PREVIOUS_RELEASE" ]]; then
  ln -sfn "$RELEASES_DIR/$PREVIOUS_RELEASE" "${PREVIOUS_LINK}.tmp"
  mv -Tf "${PREVIOUS_LINK}.tmp" "$PREVIOUS_LINK"
fi

ln -sfn "$FINAL_RELEASE_DIR" "${CURRENT_LINK}.tmp"
mv -Tf "${CURRENT_LINK}.tmp" "$CURRENT_LINK"
log "Symlink updated ✅"

# ─── 11. Start / restart service ──────────────────────────────────────────────

log "Starting service..."
systemctl restart "$SERVICE"
sleep 3

if ! systemctl is-active --quiet "$SERVICE"; then
  log "ERROR: service failed to start"
  # Auto-rollback to previous
  if [[ -n "$PREVIOUS_RELEASE" ]]; then
    log "Auto-rolling back to $PREVIOUS_RELEASE ..."
    ln -sfn "$RELEASES_DIR/$PREVIOUS_RELEASE" "${CURRENT_LINK}.tmp"
    mv -Tf "${CURRENT_LINK}.tmp" "$CURRENT_LINK"
    systemctl restart "$SERVICE" 2>/dev/null || true
  fi
  exit 1
fi
log "Service started ✅"

# ─── 12. Health verification ─────────────────────────────────────────────────

log "Verifying health..."
sleep 2

if ! curl --fail --silent http://127.0.0.1:3000/ > /dev/null; then
  log "ERROR: Homepage not responding"
  # Auto-rollback
  if [[ -n "$PREVIOUS_RELEASE" ]]; then
    log "Auto-rolling back to $PREVIOUS_RELEASE ..."
    ln -sfn "$RELEASES_DIR/$PREVIOUS_RELEASE" "${CURRENT_LINK}.tmp"
    mv -Tf "${CURRENT_LINK}.tmp" "$CURRENT_LINK"
    systemctl restart "$SERVICE" 2>/dev/null || true
  fi
  exit 1
fi
log "Homepage: 200 ✅"

check_health "http://127.0.0.1:3000/api/health" || {
  log "ERROR: Health check failed"
  if [[ -n "$PREVIOUS_RELEASE" ]]; then
    log "Auto-rolling back to $PREVIOUS_RELEASE ..."
    ln -sfn "$RELEASES_DIR/$PREVIOUS_RELEASE" "${CURRENT_LINK}.tmp"
    mv -Tf "${CURRENT_LINK}.tmp" "$CURRENT_LINK"
    systemctl restart "$SERVICE" 2>/dev/null || true
  fi
  exit 1
}

# ─── Done ────────────────────────────────────────────────────────────────────

log ""
log "╔══════════════════════════════════╗"
log "║  Deployment complete ✅          ║"
log "╠══════════════════════════════════╣"
log "║  Release : $RELEASE_ID"
log "║  Service : $(systemctl is-active "$SERVICE")"
log "╚══════════════════════════════════╝"
