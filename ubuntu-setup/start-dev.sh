
#!/bin/bash

# Start Inventoria in Development Mode
echo "Starting Inventoria in development mode..."

# Load environment variables from .env file
if [ -f ".env" ]; then
    echo "Loading environment variables from .env file..."
    set -a
    source .env
    set +a
else
    echo "Warning: .env file not found. Please run setup.sh first."
    exit 1
fi

# Start the development server
echo "Starting development server on http://localhost:5000"
npm run dev
