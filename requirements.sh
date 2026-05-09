#!/usr/bin/env bash
set -euo pipefail

# Ensure pnpm is available via Corepack.
corepack enable

# Install all workspace dependencies from lockfile.
pnpm install

echo "Workspace dependencies installed successfully."
