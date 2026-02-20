#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
# backup-db.sh — On-demand PostgreSQL dump to S3
#
# Usage:
#   DATABASE_URL="postgresql://user:pass@host:5432/hackathon" ./scripts/backup-db.sh
#
# Requires: pg_dump, aws CLI, gzip
# ────────────────────────────────────────────────────────────────
set -euo pipefail

BACKUP_BUCKET="${BACKUP_BUCKET:-hacklanta-uploads-backup}"
BACKUP_PREFIX="${BACKUP_PREFIX:-db-backups}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
DUMP_FILE="hacklanta-${TIMESTAMP}.dump"
S3_KEY="${BACKUP_PREFIX}/${DUMP_FILE}"

# ── Validate prerequisites ──
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL environment variable is required." >&2
  echo "  export DATABASE_URL='postgresql://user:pass@host:5432/hackathon'" >&2
  exit 1
fi

# Strip SQLAlchemy driver suffix so pg_dump can parse the URL
# (e.g. postgresql+asyncpg://... → postgresql://...)
DATABASE_URL="${DATABASE_URL/+asyncpg/}"

# Convert ?ssl=require to pg_dump-compatible sslmode param
DATABASE_URL="${DATABASE_URL/\?ssl=require/\?sslmode=require}"

for cmd in pg_dump aws; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "ERROR: '$cmd' is required but not found in PATH." >&2
    exit 1
  fi
done

# ── Create temp directory with cleanup trap ──
TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

LOCAL_PATH="${TMPDIR}/${DUMP_FILE}"

echo "==> Starting pg_dump..."
echo "    Timestamp: ${TIMESTAMP}"
echo "    Output:    ${LOCAL_PATH}"

pg_dump "$DATABASE_URL" \
  --format=custom \
  --verbose \
  --no-owner \
  --no-privileges \
  --file="$LOCAL_PATH"

LOCAL_SIZE=$(stat -f%z "$LOCAL_PATH" 2>/dev/null || stat -c%s "$LOCAL_PATH" 2>/dev/null)
echo "==> Dump complete. Size: ${LOCAL_SIZE} bytes"

echo "==> Uploading to s3://${BACKUP_BUCKET}/${S3_KEY}..."
aws s3 cp "$LOCAL_PATH" "s3://${BACKUP_BUCKET}/${S3_KEY}" \
  --sse AES256

# ── Verify upload ──
S3_SIZE=$(aws s3api head-object \
  --bucket "$BACKUP_BUCKET" \
  --key "$S3_KEY" \
  --query 'ContentLength' \
  --output text)

if [[ "$LOCAL_SIZE" != "$S3_SIZE" ]]; then
  echo "ERROR: Size mismatch! Local=${LOCAL_SIZE}, S3=${S3_SIZE}" >&2
  exit 1
fi

echo "==> Upload verified. Local=${LOCAL_SIZE}, S3=${S3_SIZE}"
echo ""
echo "────────────────────────────────────────────────"
echo "  Backup complete!"
echo "  S3 URI: s3://${BACKUP_BUCKET}/${S3_KEY}"
echo ""
echo "  To restore:"
echo "    aws s3 cp s3://${BACKUP_BUCKET}/${S3_KEY} ${DUMP_FILE}"
echo "    pg_restore --verbose --clean --if-exists --no-owner \\"
echo "      --dbname=\$DATABASE_URL ${DUMP_FILE}"
echo "────────────────────────────────────────────────"
