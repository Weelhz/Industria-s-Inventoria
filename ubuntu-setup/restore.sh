
#!/bin/bash

# Inventoria Database Restore Script

set -e

# Configuration
DB_NAME="inventoria"
DB_USER="inventoria_user"
BACKUP_DIR="$HOME/inventoria-backups"

if [ -z "$1" ]; then
    echo "❌ Usage: $0 <backup_file>"
    echo "📋 Available backups:"
    ls -la "$BACKUP_DIR"/inventoria_backup_*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will replace all data in the database!"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🛑 Stopping Inventoria service..."
sudo systemctl stop inventoria

echo "🗄️ Restoring database from: $BACKUP_FILE"

# Drop and recreate database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Restore from backup
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -h localhost -U "$DB_USER" -d "$DB_NAME"
else
    psql -h localhost -U "$DB_USER" -d "$DB_NAME" < "$BACKUP_FILE"
fi

echo "🚀 Starting Inventoria service..."
sudo systemctl start inventoria

echo "✅ Database restored successfully!"
echo "🌐 Application should be available at: http://localhost:5000"
