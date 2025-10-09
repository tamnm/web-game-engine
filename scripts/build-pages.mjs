#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const docsDir = join(repoRoot, 'docs');
const snakeDist = join(repoRoot, 'packages', 'games', 'super-snake', 'dist');
const snakeDocsDir = join(docsDir, 'super-snake');

function run(command) {
  execSync(command, {
    stdio: 'inherit',
    cwd: repoRoot,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function main() {
  console.log('🛠  Building @web-game-engine/core…');
  run('npm run build --workspace @web-game-engine/core');

  console.log('🛠  Building Super Snake for GitHub Pages…');
  run('npm run build --workspace @web-game-engine/super-snake');

  console.log('🧹  Refreshing docs/super-snake…');
  rmSync(snakeDocsDir, { recursive: true, force: true });
  ensureDir(docsDir);
  cpSync(snakeDist, snakeDocsDir, { recursive: true });

  console.log('✅  GitHub Pages assets ready in docs/');
}

try {
  main();
} catch (error) {
  console.error('❌  Failed to prepare GitHub Pages assets:', error);
  process.exitCode = 1;
}
