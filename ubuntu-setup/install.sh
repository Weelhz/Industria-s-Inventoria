
#!/bin/bash

# Inventoria Ubuntu Setup Script
echo "Setting up Inventoria Inventory Management System on Ubuntu..."

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Git if not already installed
sudo apt install -y git

# Verify installations
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "PostgreSQL version: $(psql --version)"

# Setup PostgreSQL database and user with proper permissions
echo "Setting up PostgreSQL database..."
sudo -u postgres createuser --createdb inventoria || echo "User already exists"
sudo -u postgres createdb inventoria_db || echo "Database already exists"
sudo -u postgres psql -c "ALTER USER inventoria WITH PASSWORD 'inventoria123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE inventoria_db TO inventoria;"
sudo -u postgres psql -d inventoria_db -c "GRANT ALL ON SCHEMA public TO inventoria;"
sudo -u postgres psql -d inventoria_db -c "GRANT CREATE ON SCHEMA public TO inventoria;"

echo "Basic setup complete. Run setup.sh next to configure the application."
