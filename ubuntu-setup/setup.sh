#!/bin/bash

echo "Setting up Inventoria application..."

echo "Installing npm dependencies..."
cd .. && npm install && cd ubuntu-setup

if [ ! -f "../.env" ]; then
    echo "Creating .env file..."
    cat > ../.env << EOL
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_URL=postgresql://inventoria:inventoria123@localhost:5432/inventoria_db
SESSION_SECRET=$(openssl rand -base64 32)
EOL
    echo ".env file created with default values"
else
    echo ".env file already exists"
fi

echo "Setting up database schema..."
cd .. && npm run db:push && cd ubuntu-setup

echo "Building application..."
cd .. && npm run build && cd ubuntu-setup

echo "Setup complete! Use start.sh to run the application."
