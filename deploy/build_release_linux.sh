#!/usr/bin/env bash
# Build a production release artifact for Ubuntu VPS deployment.
# Usage: bash deploy/build_release_linux.sh [--out-dir /tmp]
# Must be run on Linux x86_64 with Node.js 24.18.0.
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$REPO_ROOT/web"
DEPLOY_DIR="$SCRIPT_DIR"
OUT_DIR="/tmp"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --out-dir) OUT_DIR="$2"; shift 2 ;;
    *) echo "Unknown argument: $1"; exit 1 ;;
  esac
done

# ─── 1. Environment checks ────────────────────────────────────────────────────

OS=$(uname -s)
ARCH=$(uname -m)
[[ "$OS" == "Linux" ]]   || { echo "ERROR: must run on Linux (got $OS)"; exit 1; }
[[ "$ARCH" == "x86_64" ]] || { echo "ERROR: must run on x86_64 (got $ARCH)"; exit 1; }

ACTUAL_NODE=$(node --version 2>/dev/null || echo "none")
REQUIRED_NODE="v24.18.0"
[[ "$ACTUAL_NODE" == "$REQUIRED_NODE" ]] \
  || { echo "ERROR: Node.js $REQUIRED_NODE required, got $ACTUAL_NODE"; exit 1; }

echo "Build environment: $OS $ARCH, Node $ACTUAL_NODE"

# ─── 2. Release ID ────────────────────────────────────────────────────────────

RELEASE_TIMESTAMP=$(date -u '+%Y%m%dT%H%M%SZ')
GIT_SHA=$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo "local")
RELEASE_ID="${RELEASE_TIMESTAMP}-${GIT_SHA}"
echo "Release ID: $RELEASE_ID"

# ─── 3. npm ci + generate + typecheck + lint + build ─────────────────────────

cd "$WEB_DIR"

echo ">> npm ci"
npm ci

echo ">> prisma generate"
npx prisma generate

echo ">> typecheck"
npm run typecheck

echo ">> lint"
npm run lint

echo ">> build"
npm run build

# ─── 4. Security audit (Critical/High must be zero) ───────────────────────────

echo ">> npm audit"
if ! npm audit --omit=dev --audit-level=high 2>&1; then
  echo "FATAL: High or Critical vulnerabilities detected. Aborting build."
  exit 1
fi
echo "Audit: no Critical/High ✅"

# ─── 5. Assemble directories ─────────────────────────────────────────────────

RELEASE_PARENT="$OUT_DIR/swarm56-releases"
RELEASE_DIR="$RELEASE_PARENT/$RELEASE_ID"
APP_DIR="$RELEASE_DIR/app"
MIGRATOR_DIR="$RELEASE_DIR/migrator"
MANIFEST_DIR="$RELEASE_DIR/manifest"

mkdir -p "$APP_DIR" "$MIGRATOR_DIR" "$MANIFEST_DIR"

# ─── 6. Standalone app ───────────────────────────────────────────────────────

echo ">> copying standalone"
cp -a "$WEB_DIR/.next/standalone/." "$APP_DIR/"

echo ">> copying .next/static"
mkdir -p "$APP_DIR/.next"
cp -a "$WEB_DIR/.next/static" "$APP_DIR/.next/static"

echo ">> copying public"
if [[ -d "$WEB_DIR/public" ]]; then
  cp -a "$WEB_DIR/public" "$APP_DIR/public"
fi

# ─── 7. Verify app artifact ──────────────────────────────────────────────────

echo ">> verifying app artifact"
[[ -f "$APP_DIR/server.js" ]] \
  || { echo "ERROR: server.js not found in standalone output"; exit 1; }
[[ -d "$APP_DIR/.next/static" ]] \
  || { echo "ERROR: .next/static not found"; exit 1; }
[[ -d "$APP_DIR/node_modules/@prisma/client" ]] \
  || { echo "ERROR: @prisma/client not found in standalone bundle"; exit 1; }

# Reject Windows binaries
if find "$APP_DIR" -type f \( -name "*.exe" -o -name "query_engine-windows*" \) 2>/dev/null | grep -q .; then
  echo "ERROR: Windows binaries found in artifact. Build on Linux only."
  exit 1
fi

# Require Linux Prisma query engine
if ! find "$APP_DIR/node_modules/.prisma" -type f -name "*.node" 2>/dev/null | grep -q .; then
  echo "ERROR: Linux Prisma query engine (.node) not found in artifact"
  exit 1
fi

echo "App artifact verified ✅"

# ─── 8. Migrator bundle ───────────────────────────────────────────────────────

echo ">> building migrator bundle"
cp "$DEPLOY_DIR/migrator/package.json" "$MIGRATOR_DIR/package.json"

cd "$MIGRATOR_DIR"
npm install --package-lock-only --omit=dev
npm ci --omit=dev

mkdir -p "$MIGRATOR_DIR/prisma"
cp "$WEB_DIR/prisma/schema.prisma"   "$MIGRATOR_DIR/prisma/schema.prisma"
cp -a "$WEB_DIR/prisma/migrations"   "$MIGRATOR_DIR/prisma/"
cp "$WEB_DIR/prisma/seed.ts"         "$MIGRATOR_DIR/prisma/seed.ts"

# Generate Prisma Client for migrator (required by seed.ts)
echo ">> generating Prisma Client for migrator..."
GEN_DB="/tmp/swarm56-migrator-gen-$$.db"
DATABASE_URL="file:$GEN_DB" ./node_modules/.bin/prisma generate 2>&1 | tail -3
rm -f "$GEN_DB"
echo "Migrator Prisma Client generated ✅"

# Validate migrator
echo ">> validating migrator"
./node_modules/.bin/prisma version
VALIDATE_DB="/tmp/swarm56-migrator-validate-$$.db"
DATABASE_URL="file:$VALIDATE_DB" ./node_modules/.bin/prisma validate
rm -f "$VALIDATE_DB"
echo "Migrator validated ✅"

# ─── 9. Record release ID ────────────────────────────────────────────────────

echo "$RELEASE_ID" > "$RELEASE_DIR/RELEASE_ID"

# ─── 10. SHA-256 manifest ────────────────────────────────────────────────────

echo ">> generating SHA-256 manifest"
cd "$RELEASE_DIR"
find . -type f | sort | xargs sha256sum > "$MANIFEST_DIR/manifest.sha256"
echo "Manifest: $(wc -l < "$MANIFEST_DIR/manifest.sha256") files"

# ─── 11. Security check: no secrets in artifact ───────────────────────────────

echo ">> checking for secrets in artifact"
if grep -rInE \
    'DATABASE_URL=file:|BEGIN (RSA|EC|OPENSSH) PRIVATE KEY|AWS_SECRET|CLOUDFLARE_API_TOKEN|password\s*=\s*.+' \
    "$RELEASE_DIR" 2>/dev/null \
    | grep -v "node_modules" \
    | grep -v "manifest.sha256" \
    | grep -q .; then
  echo "WARNING: potential secret patterns found in artifact (review output above)"
else
  echo "No secret patterns found ✅"
fi

# ─── 12. Package ─────────────────────────────────────────────────────────────

TARBALL="$OUT_DIR/swarm56-web-${RELEASE_ID}.tar.gz"
echo ">> creating tarball: $TARBALL"
cd "$RELEASE_PARENT"
tar -czf "$TARBALL" "$RELEASE_ID/"

TARBALL_SIZE=$(du -sh "$TARBALL" | cut -f1)
TARBALL_SHA256=$(sha256sum "$TARBALL" | cut -d' ' -f1)

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  Build complete                          ║"
echo "╠══════════════════════════════════════════╣"
printf "║  Release ID : %-27s║\n" "$RELEASE_ID"
printf "║  Tarball    : %-27s║\n" "$(basename "$TARBALL")"
printf "║  Size       : %-27s║\n" "$TARBALL_SIZE"
echo "╚══════════════════════════════════════════╝"
echo "SHA-256: $TARBALL_SHA256"
