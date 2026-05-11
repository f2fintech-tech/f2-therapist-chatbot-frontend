# Local Development Setup Guide

This guide will help you run the FinHeal chatbot locally with both frontend and backend.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose (for PostgreSQL) OR a running PostgreSQL instance
- pnpm package manager

## Quick Start

### 1. Install Dependencies

From the repo root:
```bash
./requirements.sh
```

### 2. Set Up Database

**Option A: Using Docker (Recommended for development)**

```bash
# Start PostgreSQL container
docker-compose up -d

# Wait for postgres to be healthy (check logs)
docker-compose logs postgres

# Create tables (first time only)
pnpm --filter @workspace/db run push

# Verify connection
docker-compose ps
```

**Option B: Using Existing PostgreSQL**

If you already have PostgreSQL running, set the environment variable:
```bash
export DATABASE_URL=postgresql://user:password@localhost:5432/database_name
```

Then create tables:
```bash
pnpm --filter @workspace/db run push
```

### 3. Run Frontend & Backend Together

From the repo root, run:

```bash
./start-dev.sh
```

This will:
- ✅ Start backend API on `http://localhost:3000`
- ✅ Start frontend on `http://localhost:5173`
- ✅ Connect them automatically

Then open **http://localhost:5173** and start chatting!

### 4. (Optional) Run Servers Separately for Debugging

**Terminal 1 - Backend:**
```bash
DATABASE_URL=postgresql://finheal_user:finheal_password@localhost:5432/finheal \
PORT=3000 pnpm --filter @workspace/api-server dev
```

**Terminal 2 - Frontend:**
```bash
VITE_API_URL=http://localhost:3000 \
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/f2-finheal dev
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Frontend (React)                    │
│              Running on http://localhost:5173             │
│  - ChatArea, Sidebar, InsightsPanel components          │
│  - Auto-generated API client (react-query hooks)        │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP Requests
                 │ POST /api/v1/chat
                 │ GET /api/v1/chat/sessions/:user_id
                 ↓
┌─────────────────────────────────────────────────────────┐
│                 Backend (Express.js)                     │
│              Running on http://localhost:3000            │
│  - Chat routes, session management                      │
│  - AI response generation                               │
│  - CORS enabled for localhost:5173                      │
└────────────────┬────────────────────────────────────────┘
                 │ SQL Queries
                 ↓
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                   │
│  - Chat messages, sessions, financial goals             │
│  - Running in Docker or locally on port 5432            │
└─────────────────────────────────────────────────────────┘
```

## Key Files

- **Frontend App**: [artifacts/f2-finheal/src/App.tsx](artifacts/f2-finheal/src/App.tsx) - Configures API base URL
- **Chat Component**: [artifacts/f2-finheal/src/components/ChatArea.tsx](artifacts/f2-finheal/src/components/ChatArea.tsx) - Main chat UI
- **API Client**: [lib/api-client-react/](lib/api-client-react/) - auto-generated from OpenAPI
- **Backend Routes**: [artifacts/api-server/src/routes/chat.ts](artifacts/api-server/src/routes/chat.ts) - Chat endpoints
- **API Spec**: [lib/api-spec/openapi.yaml](lib/api-spec/openapi.yaml) - OpenAPI/Swagger definition

## Troubleshooting

### Database Connection Error

**Problem**: `DATABASE_URL environment variable is required`

**Solution**:
```bash
# If using docker-compose
export DATABASE_URL=postgresql://finheal_user:finheal_password@localhost:5432/finheal

# Or for existing PostgreSQL
export DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_db
```

### Frontend can't reach backend

**Problem**: Network error when sending messages

**Check**:
1. Backend is running on port 3000: `curl http://localhost:3000/api/health`
2. Frontend has correct API URL: Check browser console
3. CORS is enabled (it should be by default)

### Port already in use

**Problem**: `Error: listen EADDRINUSE :::3000`

**Solution**: Kill the process or use different port:
```bash
# Use custom port
PORT=3001 pnpm --filter @workspace/api-server dev
VITE_API_URL=http://localhost:3001 PORT=5173 pnpm --filter @workspace/f2-finheal dev
```

## Useful Commands

```bash
# Type checking
pnpm run typecheck

# Build for production
pnpm run build

# Start dev servers with auto-reload
./start-dev.sh

# Stop Docker services
docker-compose down
```

## Next Steps

1. ✅ Chatbot is now functional
2. 🔄 Messages persist to database
3. 📊 Track mood insights
4. 💳 Plan loan integration
5. 📱 Deploy to production

Happy chatting! 🚀
