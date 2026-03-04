#!/bin/bash
set -eo pipefail

echo "=== Render Build Script ==="
echo "Node: $(node --version)"
echo "npm: $(npm --version)"

# 1. Install pnpm
echo "--- Step 1: Install pnpm ---"
npm install -g pnpm@9
echo "pnpm: $(pnpm --version)"

# 2. Install dependencies (skip postinstall hooks to avoid premature prisma generate)
echo "--- Step 2: Install dependencies ---"
pnpm install --ignore-scripts
echo "Dependencies installed."

# 3. Fix pnpm .pnpm store isolation for prisma generate
# prisma CLI runs from .pnpm/prisma@xxx/node_modules/prisma/ and cannot
# resolve @prisma/client because it's in a separate .pnpm entry.
# We create a symlink to make @prisma/client visible from prisma's context.
echo "--- Step 3: Link @prisma/client into prisma context ---"
PRISMA_PKG=$(node -e "console.log(require.resolve('prisma/package.json'))")
PRISMA_NM=$(dirname "$(dirname "$PRISMA_PKG")")
echo "Prisma node_modules: $PRISMA_NM"

if [ ! -d "$PRISMA_NM/@prisma/client" ]; then
  mkdir -p "$PRISMA_NM/@prisma"
  ln -s "$(pwd)/node_modules/@prisma/client" "$PRISMA_NM/@prisma/client"
  echo "Linked: $(pwd)/node_modules/@prisma/client -> $PRISMA_NM/@prisma/client"
else
  echo "@prisma/client already visible in prisma context"
fi

# 4. Generate Prisma client
echo "--- Step 4: Generate Prisma client ---"
PRISMA_GENERATE_SKIP_AUTOINSTALL=true npx prisma generate --schema=packages/database/prisma/schema.prisma
echo "Prisma client generated."

# 5. Build API (and all its dependencies)
echo "--- Step 5: Build API ---"
pnpm exec turbo build --filter=@ponylab/api...

echo "=== Build Complete ==="
