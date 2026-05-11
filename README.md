# FinHeal Friend Monorepo Setup

This repository uses a pnpm workspace. Install dependencies from the repository root.

## Prerequisites

- Node.js 20+
- Corepack enabled (comes with modern Node.js)

## Install all modules at once

From the repo root, run:

```bash
./requirements.sh
```

This installs dependencies for the full workspace (all packages under artifacts, lib, and scripts).

## Run the frontend against your backend

Make sure your FastAPI backend is running at the URL in `.env`:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

From the repo root, run:

```bash
./start-dev.sh
```

Then open http://localhost:5173

This starts only the frontend and points it at the backend URL from `.env`.

## Useful commands

```bash
pnpm run typecheck
pnpm run build
```

## Notes

- Use pnpm, not npm or yarn.
- node_modules is intentionally ignored in git.
