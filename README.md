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

## Run frontend

From the repo root, run:

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/f2-finheal dev
```

Then open http://localhost:5173

## Useful commands

```bash
pnpm run typecheck
pnpm run build
```

## Notes

- Use pnpm, not npm or yarn.
- node_modules is intentionally ignored in git.
