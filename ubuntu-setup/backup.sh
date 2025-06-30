
#!/bin/bash

# Inventoria Database Backup Script

set -e

# Configuration
DB_NAME="inventoria"
DB_USER="inventoria_user"
BACKUP_DIR="$HOME/inventoria-backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/inventoria_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️ Creating database backup..."

# Create database dump
pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"
COMPRESSED_FILE="$BACKUP_FILE.gz"

echo "✅ Backup created: $COMPRESSED_FILE"

# Keep only last 7 backups
echo "🧹 Cleaning old backups (keeping last 7)..."
cd "$BACKUP_DIR"
ls -t inventoria_backup_*.sql.gz | tail -n +8 | xargs -r rm

echo "📊 Current backups:"
ls -la inventoria_backup_*.sql.gz

echo "✅ Backup completed successfully!"
