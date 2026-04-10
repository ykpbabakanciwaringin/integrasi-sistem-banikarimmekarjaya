#!/bin/bash
# Database Backup Script
# Usage: ./scripts/backup-db.sh [output-file]

set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${POSTGRES_DB:-new_ykp_system}"
DB_USER="${POSTGRES_USER:-postgres}"
OUTPUT_FILE="${1:-${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql}"

# Create backup directory if not exists
mkdir -p "$(dirname "$OUTPUT_FILE")"

echo "Starting database backup..."
echo "Database: $DB_NAME"
echo "Output: $OUTPUT_FILE"

# Run backup using docker-compose exec
docker-compose exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$OUTPUT_FILE"

# Compress backup
if command -v gzip &> /dev/null; then
    echo "Compressing backup..."
    gzip "$OUTPUT_FILE"
    OUTPUT_FILE="${OUTPUT_FILE}.gz"
fi

# Get file size
FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo "✅ Backup completed successfully!"
echo "File: $OUTPUT_FILE"
echo "Size: $FILE_SIZE"

# Optional: Keep only last N backups
KEEP_BACKUPS="${KEEP_BACKUPS:-7}"
if [ -d "$(dirname "$OUTPUT_FILE")" ]; then
    echo "Cleaning old backups (keeping last $KEEP_BACKUPS)..."
    cd "$(dirname "$OUTPUT_FILE")"
    ls -t backup_*.sql.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -f 2>/dev/null || true
fi
