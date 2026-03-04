#!/bin/bash
set -eo pipefail

echo "=== Render Build Script ==="
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# 1. Install pnpm
echo "--- Step 1: Install pnpm ---"
npm install -g pnpm@9
echo "pnpm: $(pnpm --version)"

# 2. Install dependencies
echo "--- Step 2: Install dependencies ---"
pnpm install
echo "Dependencies installed."

# 3. Generate Prisma client
# prisma CLI runs from .pnpm store and cannot resolve @prisma/client.
# We use a Node.js --require preload to patch module resolution.
echo "--- Step 3: Generate Prisma client ---"
PROJECT_ROOT="$(pwd)" \
PRISMA_GENERATE_SKIP_AUTOINSTALL=true \
NODE_OPTIONS="--require $(pwd)/scripts/prisma-resolve-patch.js" \
  npx prisma generate --schema=packages/database/prisma/schema.prisma
echo "Prisma client generated."

# 4. Build API (and all its dependencies)
echo "--- Step 4: Build API ---"
pnpm exec turbo build --filter=@ponylab/api...

echo "=== Build Complete ==="
