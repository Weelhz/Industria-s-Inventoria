#!/bin/bash

echo "Setting up Inventoria Inventory Management System on Ubuntu..."

sudo apt update && sudo apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo apt install -y postgresql postgresql-contrib

sudo apt install -y git

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "PostgreSQL version: $(psql --version)"

echo "Setting up PostgreSQL database..."
sudo -u postgres createuser --createdb inventoria || echo "User already exists"
sudo -u postgres createdb inventoria_db || echo "Database already exists"
sudo -u postgres psql -c "ALTER USER inventoria WITH PASSWORD 'inventoria123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE inventoria_db TO inventoria;"
sudo -u postgres psql -d inventoria_db -c "GRANT ALL ON SCHEMA public TO inventoria;"
sudo -u postgres psql -d inventoria_db -c "GRANT CREATE ON SCHEMA public TO inventoria;"

echo "Basic setup complete. Run setup.sh next to configure the application."
