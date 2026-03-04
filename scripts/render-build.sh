#!/bin/bash
set -eo pipefail

echo "=== Render Build Script ==="
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# 1. Install pnpm
echo "--- Step 1: Install pnpm ---"
npm install -g pnpm@9
echo "pnpm: $(pnpm --version)"

# 2. Install dependencies with hoisted node_modules (flat layout like npm)
# .npmrc has node-linker=hoisted which creates a flat node_modules without
# pnpm's .pnpm symlink store, allowing prisma to resolve @prisma/client.
echo "--- Step 2: Install dependencies ---"
pnpm install
echo "Dependencies installed."

# Debug: verify @prisma/client is a real directory (not symlink)
echo "--- Verify: @prisma/client layout ---"
ls -la node_modules/@prisma/client/package.json 2>/dev/null || echo "  NOT FOUND at root"
ls -la packages/database/node_modules/@prisma/client/package.json 2>/dev/null || echo "  NOT FOUND at schema level"
echo "node_modules/.pnpm exists? $([ -d node_modules/.pnpm ] && echo YES || echo NO)"

# 3. Generate Prisma client
echo "--- Step 3: Generate Prisma client ---"
pnpm exec prisma generate --schema=packages/database/prisma/schema.prisma
echo "Prisma client generated."

# 4. Build API (and all its dependencies)
echo "--- Step 4: Build API ---"
pnpm exec turbo build --filter=@ponylab/api...

echo "=== Build Complete ==="
