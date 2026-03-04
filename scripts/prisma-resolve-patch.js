// Patch Node.js module resolution for pnpm + prisma compatibility.
// When prisma CLI runs from .pnpm store, it cannot resolve @prisma/client.
// This preload script adds the project root's node_modules to the search path.
const Module = require('module');
const path = require('path');
const projectRoot = process.env.PROJECT_ROOT || process.cwd();

const origResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === '@prisma/client' || request.startsWith('@prisma/client/')) {
    try {
      return origResolveFilename.call(this, request, parent, isMain, {
        ...options,
        paths: [...(options?.paths || []), path.join(projectRoot, 'node_modules')],
      });
    } catch {
      // Fall through to original resolution
    }
  }
  return origResolveFilename.call(this, request, parent, isMain, options);
};
