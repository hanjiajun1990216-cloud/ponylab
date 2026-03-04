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

# 3. Make @prisma/client resolvable from the schema directory
# Prisma resolves @prisma/client from the schema file's location, NOT from CWD
# or the prisma binary. In pnpm workspace, packages/database/ may not have its
# own node_modules/@prisma/client. We copy it there so prisma can find it.
echo "--- Step 3: Setup @prisma/client for schema resolution ---"
SCHEMA_DIR="packages/database"
CLIENT_SRC=$(node -e "console.log(require.resolve('@prisma/client/package.json').replace('/package.json',''))")
echo "Source @prisma/client: $CLIENT_SRC"

# Debug: check what exists
echo "Root node_modules/@prisma/:"
ls -la node_modules/@prisma/ 2>/dev/null || echo "  (not found)"
echo "Schema-level node_modules/@prisma/:"
ls -la "$SCHEMA_DIR/node_modules/@prisma/" 2>/dev/null || echo "  (not found)"

# Force remove any existing symlink (pnpm creates symlinks that prisma can't follow)
rm -rf "$SCHEMA_DIR/node_modules/@prisma/client"
mkdir -p "$SCHEMA_DIR/node_modules/@prisma"
cp -rL "$CLIENT_SRC" "$SCHEMA_DIR/node_modules/@prisma/client"
echo "Force-copied @prisma/client (real files) to $SCHEMA_DIR/node_modules/@prisma/client"
ls -la "$SCHEMA_DIR/node_modules/@prisma/" 2>/dev/null || echo "  (verify failed)"

# 4. Generate Prisma client
echo "--- Step 4: Generate Prisma client ---"
PRISMA_GENERATE_SKIP_AUTOINSTALL=true pnpm exec prisma generate --schema=$SCHEMA_DIR/prisma/schema.prisma
echo "Prisma client generated."

# 5. Build API (and all its dependencies)
echo "--- Step 5: Build API ---"
pnpm exec turbo build --filter=@ponylab/api...

echo "=== Build Complete ==="
