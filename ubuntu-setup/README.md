
# Inventoria Ubuntu Setup Guide

This guide will help you deploy Inventoria Inventory Management System on Ubuntu.

## Quick Setup

1. **Initial Installation**
   ```bash
   chmod +x ubuntu-setup/install.sh
   sudo ./ubuntu-setup/install.sh
   ```

2. **Application Setup**
   ```bash
   chmod +x ubuntu-setup/setup.sh
   ./ubuntu-setup/setup.sh
   ```

3. **Start Application**
   ```bash
   chmod +x ubuntu-setup/start.sh
   ./ubuntu-setup/start.sh
   ```

## Manual Setup Steps

### 1. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### 2. Setup Database
```bash
# Create database user and database
sudo -u postgres createuser --createdb inventoria
sudo -u postgres createdb inventoria_db
sudo -u postgres psql -c "ALTER USER inventoria WITH PASSWORD 'inventoria123';"
```

### 3. Configure Application
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env  # Edit with your database credentials

# Setup database schema
npm run db:push

# Build application
npm run build
```

### 4. Run Application
```bash
# Production mode
npm start

# Development mode
npm run dev
```

## Running as System Service

For production deployment, set up Inventoria as a systemd service:

```bash
chmod +x ubuntu-setup/service-setup.sh
sudo ./ubuntu-setup/service-setup.sh
```

Then manage with:
```bash
sudo systemctl start inventoria    # Start service
sudo systemctl stop inventoria     # Stop service
sudo systemctl status inventoria   # Check status
sudo systemctl restart inventoria  # Restart service
```

## Access Application

- **Local access**: http://localhost:5000
- **Network access**: http://YOUR_SERVER_IP:5000

## Default Login

- **Username**: admin
- **Password**: admin123

Change the default password after first login in the Users section.

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Application Logs
```bash
# If running as service
sudo journalctl -u inventoria -f

# If running manually
npm run dev  # Shows detailed logs
```

### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill process if needed
sudo kill -9 <PID>
```

## Configuration

Edit `.env` file to customize:
- `PORT`: Application port (default: 5000)
- `HOST`: Bind address (default: 0.0.0.0)
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key

## Security Notes

- Change default PostgreSQL password
- Set strong SESSION_SECRET
- Configure firewall rules
- Use reverse proxy (nginx) for production
- Enable SSL/TLS certificates
