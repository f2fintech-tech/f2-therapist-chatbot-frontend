#!/usr/bin/env bash
set -euo pipefail

# Ensure pnpm is available via Corepack.
corepack enable

# Some environments do not populate this variable for lifecycle scripts.
# The repo preinstall guard expects it to indicate pnpm usage.
export npm_config_user_agent="${npm_config_user_agent:-pnpm/setup-script}"

# Install all workspace dependencies from lockfile.
pnpm approve-builds --all
pnpm install

echo "Workspace dependencies installed successfully."
