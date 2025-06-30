#!/bin/bash

set -e

DB_NAME="inventoria"
DB_USER="inventoria_user"
BACKUP_DIR="$HOME/inventoria-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/inventoria_backup_$DATE.sql"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup..."

pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

gzip "$BACKUP_FILE"
COMPRESSED_FILE="$BACKUP_FILE.gz"

echo "Backup created: $COMPRESSED_FILE"

echo "Cleaning old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t inventoria_backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "Current backups:"
ls -la inventoria_backup_*.sql.gz

echo "Backup completed successfully!"
