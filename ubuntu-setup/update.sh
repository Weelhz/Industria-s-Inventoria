
#!/bin/bash

# Inventoria Update Script

set -e

APP_DIR="$HOME/inventoria"
BACKUP_DIR="$HOME/inventoria-backups"

echo "🔄 Starting Inventoria update process..."

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    echo "❌ Inventoria not found at $APP_DIR"
    echo "Please run the install script first"
    exit 1
fi

cd "$APP_DIR"

echo "🗄️ Creating backup before update..."
./ubuntu-setup/backup.sh

echo "🛑 Stopping Inventoria service..."
sudo systemctl stop inventoria

echo "📦 Updating dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "🚀 Starting Inventoria service..."
sudo systemctl start inventoria

echo "✅ Update completed successfully!"
echo "🌐 Application is available at: http://localhost:5000"
echo "📊 Check status with: sudo systemctl status inventoria"
