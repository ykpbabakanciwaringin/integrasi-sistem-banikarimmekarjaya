#!/bin/bash
# Database Restore Script
# Usage: ./scripts/restore-db.sh <backup-file.sql>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Backup file required"
    echo "Usage: $0 <backup-file.sql>"
    exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${POSTGRES_DB:-new_ykp_system}"
DB_USER="${POSTGRES_USER:-postgres}"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" | docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME"
else
    echo "Restoring database from: $BACKUP_FILE"
    docker-compose exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

echo "✅ Database restored successfully!"
