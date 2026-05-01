#!/usr/bin/env node
/**
 * Auto-installs the Hebrew Translator skill into OpenCode.
 *
 * Usage:  npm run install-opencode
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILLS_DIR = path.join(os.homedir(), '.opencode', 'skills');
const SKILL_NAME = 'hebrew-auto-translate';
const DEST_DIR = path.join(SKILLS_DIR, SKILL_NAME);
const SOURCE_DIR = path.join(__dirname, 'skills', 'opencode');

function copyDirRecursive(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error('Source skill directory not found at:', SOURCE_DIR);
    process.exit(1);
  }

  copyDirRecursive(SOURCE_DIR, DEST_DIR);

  console.log(`Installed skill to ${DEST_DIR}`);
  console.log('');
  console.log('Done! Restart OpenCode, then:');
  console.log('  - Type in Hebrew and it will auto-translate');
  console.log('  - Or use /hebrew-translate "שלום עולם" for manual translation');
}

main();
