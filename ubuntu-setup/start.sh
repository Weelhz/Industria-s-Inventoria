#!/bin/bash

# Start Inventoria application
echo "Starting Inventoria Inventory Management System..."

# Load environment variables from .env file
if [ -f "../.env" ]; then
    echo "Loading environment variables from .env file..."
    set -a
    source ../.env
    set +a
else
    echo "Warning: .env file not found. Please run setup.sh first."
    exit 1
fi

# Check if port 5000 is in use and kill the process
echo "Checking if port 5000 is already in use..."
PID=$(lsof -ti:5000)
if [ ! -z "$PID" ]; then
    echo "Port 5000 is in use by process $PID. Stopping it..."
    kill -9 $PID
    sleep 2
fi

# Check if build directory exists in parent directory
if [ ! -d "../dist" ]; then
    echo "Build directory not found. Running build..."
    cd .. && npm run build && cd ubuntu-setup
else
    echo "Build directory found, skipping build step..."
fi

echo "Starting server on http://localhost:5000"
cd .. && npm start