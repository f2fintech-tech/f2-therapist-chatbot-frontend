#!/bin/bash

# Script to run the frontend against the external FastAPI backend
# Usage: ./start-dev.sh
# Optional: BACKEND_BASE_URL=http://127.0.0.1:8000/api/v1 ./start-dev.sh

FRONTEND_PORT=${2:-5173}
BACKEND_BASE_URL=${BACKEND_BASE_URL:-http://127.0.0.1:8000/api/v1}

echo "🚀 Starting FinHeal Chatbot Development Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo "Backend:  $BACKEND_BASE_URL"
echo ""
echo "Make sure your backend repo is already running before using the app."
echo "Press Ctrl+C to stop the frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Function to stop the frontend on exit
cleanup() {
    echo ""
    echo "Stopping frontend..."
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT

# Start frontend server
VITE_API_BASE_URL=$BACKEND_BASE_URL PORT=$FRONTEND_PORT BASE_PATH=/ pnpm --filter @workspace/f2-finheal dev &
FRONTEND_PID=$!

# Wait for the frontend process
wait
