#!/usr/bin/env node
/**
 * Auto-installs the Hebrew Translator MCP server into Claude Code settings.
 *
 * Usage:  npm run install-claude
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SETTINGS_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json');
const TOOLS_DIR = path.join(SETTINGS_DIR, 'tools');
const SERVER_FILE = 'hebrew-translator-mcp.js';

// Resolve the bundled server from this project
const PROJECT_DIR = __dirname;
const BUNDLED_SERVER = path.join(PROJECT_DIR, 'dist', SERVER_FILE);

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {
    console.log('No existing settings.json found — creating one.');
    return {};
  }
}

function saveSettings(settings) {
  if (!fs.existsSync(SETTINGS_DIR)) {
    fs.mkdirSync(SETTINGS_DIR, { recursive: true });
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + '\n');
}

function main() {
  // Ensure the bundled server exists
  if (!fs.existsSync(BUNDLED_SERVER)) {
    console.error('Bundled server not found at:', BUNDLED_SERVER);
    console.error('Run "npm run bundle" first, or "npx esbuild ..." manually.');
    process.exit(1);
  }

  // Copy bundled server to ~/.claude/tools/
  if (!fs.existsSync(TOOLS_DIR)) {
    fs.mkdirSync(TOOLS_DIR, { recursive: true });
  }

  const dest = path.join(TOOLS_DIR, SERVER_FILE);
  fs.copyFileSync(BUNDLED_SERVER, dest);
  console.log(`Copied bundled server → ${dest}`);

  // Update settings.json
  const settings = loadSettings();
  if (!settings.mcpServers) {
    settings.mcpServers = {};
  }

  settings.mcpServers['hebrew-translator'] = {
    command: 'node',
    args: [dest]
  };

  saveSettings(settings);
  console.log(`Updated settings.json → ${SETTINGS_FILE}`);
  console.log('');
  console.log('Done! Restart Claude Code, then the "hebrew_translate" tool will be available.');
  console.log('');
  console.log('Usage: When you type Hebrew, Claude will detect it and can call the tool automatically.');
  console.log('       Or ask Claude to translate: "translate this to Hebrew: שלום עולם"');
}

main();
