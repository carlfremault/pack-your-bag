#!/usr/bin/env bash
set -euo pipefail

# ── Configuration ──────────────────────────────────────────────
APP_DIR="${APP_DIR:-$HOME/pack-your-bag}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups}"
COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
S3_BUCKET="${S3_BUCKET:-s3://packyourbag-backups}"
LOG_FILE="$BACKUP_DIR/backup.log"

DATE=$(date +%Y-%m-%d_%H%M%S)
DAY_OF_WEEK=$(date +%u) # 1=Monday, 7=Sunday

DAILY_DIR="$BACKUP_DIR/daily"
WEEKLY_DIR="$BACKUP_DIR/weekly"

mkdir -p "$DAILY_DIR" "$WEEKLY_DIR"

# ── Logging ────────────────────────────────────────────────────
if [ -f "$LOG_FILE" ] && [ "$(wc -l < "$LOG_FILE")" -gt 2000 ]; then
  tail -500 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi

exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================"
echo "[$(date)] Backup starting"
echo "========================================"

# ── Load credentials from env files ────────────────────────────
set -a
# shellcheck source=/dev/null
source "$APP_DIR/.env.postgres"
# shellcheck source=/dev/null
source "$APP_DIR/.env.mongo"
set +a

# ── PostgreSQL ─────────────────────────────────────────────────
PG_FILE="$DAILY_DIR/postgres_${DATE}.sql.gz"
echo "[$(date)] PostgreSQL backup starting..."
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists | \
  gzip > "$PG_FILE"
echo "[$(date)] PostgreSQL done ($(du -h "$PG_FILE" | cut -f1))"

# ── MongoDB ────────────────────────────────────────────────────
MONGO_FILE="$DAILY_DIR/mongo_${DATE}.archive.gz"
echo "[$(date)] MongoDB backup starting..."
docker compose -f "$COMPOSE_FILE" exec -T mongo \
  mongodump --archive --gzip \
  -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin --db userDataService \
  > "$MONGO_FILE"
echo "[$(date)] MongoDB done ($(du -h "$MONGO_FILE" | cut -f1))"

# ── Weekly snapshot (Sunday) ───────────────────────────────────
if [ "$DAY_OF_WEEK" = "7" ]; then
  echo "[$(date)] Creating weekly snapshot..."
  cp "$PG_FILE" "$WEEKLY_DIR/"
  cp "$MONGO_FILE" "$WEEKLY_DIR/"
fi

# ── Retention: 7 daily, 4 weekly ──────────────────────────────
echo "[$(date)] Pruning old backups..."
find "$DAILY_DIR" -type f -mtime +7 -delete
for pattern in "postgres_*.sql.gz" "mongo_*.archive.gz"; do
  # shellcheck disable=SC2086
  ls -t "$WEEKLY_DIR"/$pattern 2>/dev/null | tail -n +5 | xargs -r rm -f || true
done

# ── Sync to Hetzner Object Storage ────────────────────────────
echo "[$(date)] Syncing to Hetzner Object Storage..."
s3cmd sync "$DAILY_DIR/" "$S3_BUCKET/daily/" --delete-removed --no-progress
s3cmd sync "$WEEKLY_DIR/" "$S3_BUCKET/weekly/" --delete-removed --no-progress

echo "[$(date)] Backup complete!"
