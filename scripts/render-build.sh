#!/bin/bash
set -eo pipefail

echo "=== Render Build Script ==="
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# 1. Install pnpm
echo "--- Step 1: Install pnpm ---"
npm install -g pnpm@9
echo "pnpm: $(pnpm --version)"

# 2. Install ALL dependencies (including devDependencies needed for build)
# NODE_ENV=production makes pnpm skip devDeps, but we need @nestjs/cli, turbo, etc.
# .npmrc has node-linker=hoisted for flat layout (fixes prisma resolution).
echo "--- Step 2: Install dependencies ---"
NODE_ENV=development pnpm install
echo "Dependencies installed."

# Debug: verify @prisma/client is a real directory (not symlink)
echo "--- Verify: @prisma/client layout ---"
ls -la node_modules/@prisma/client/package.json 2>/dev/null || echo "  NOT FOUND at root"
ls -la packages/database/node_modules/@prisma/client/package.json 2>/dev/null || echo "  NOT FOUND at schema level"
echo "node_modules/.pnpm exists? $([ -d node_modules/.pnpm ] && echo YES || echo NO)"

# 3. Generate Prisma client
echo "--- Step 3: Generate Prisma client ---"
npx prisma generate --schema=packages/database/prisma/schema.prisma
echo "Prisma client generated."

# 4. Push schema to database (idempotent, applies any new model changes)
echo "--- Step 4: Push Prisma schema to DB ---"
npx prisma db push --schema=packages/database/prisma/schema.prisma --skip-generate --accept-data-loss
echo "Schema pushed."

# 5. Seed database (idempotent — cleans and re-seeds)
echo "--- Step 5: Seed database ---"
cd packages/database && npx tsx prisma/seed.ts && cd ../..
echo "Database seeded."

# 6. Build API (and all its dependencies)
echo "--- Step 6: Build API ---"
# Use npx as fallback since pnpm exec may not find turbo with node-linker=hoisted
npx turbo build --filter=@ponylab/api...

echo "=== Build Complete ==="
