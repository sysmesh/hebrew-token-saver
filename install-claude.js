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

  // Install skill files to ~/.claude/skills/claude-code/
  const SKILL_SRC = path.join(PROJECT_DIR, 'skills', 'claude-code');
  const SKILL_DST = path.join(SETTINGS_DIR, 'skills', 'claude-code');

  if (fs.existsSync(SKILL_SRC)) {
    if (!fs.existsSync(SKILL_DST)) {
      fs.mkdirSync(SKILL_DST, { recursive: true });
    }
    // Copy hebrew-translate.md (the slash command skill)
    const skillFile = path.join(SKILL_SRC, 'hebrew-translate.md');
    if (fs.existsSync(skillFile)) {
      fs.copyFileSync(skillFile, path.join(SKILL_DST, 'hebrew-translate.md'));
      console.log(`Copied skill → ${path.join(SKILL_DST, 'hebrew-translate.md')}`);
    }
    // Copy SKILL.md (documentation)
    const skillDoc = path.join(SKILL_SRC, 'SKILL.md');
    if (fs.existsSync(skillDoc)) {
      fs.copyFileSync(skillDoc, path.join(SKILL_DST, 'SKILL.md'));
      console.log(`Copied skill doc → ${path.join(SKILL_DST, 'SKILL.md')}`);
    }
  }

  console.log('');
  console.log('Done! Restart Claude Code, then:');
  console.log('  - The "hebrew_translate" MCP tool will be available');
  console.log('  - The "/hebrew-translate" slash command will work');
  console.log('');
  console.log('Usage: When you type Hebrew, Claude will detect it and can call the tool automatically.');
  console.log('       Or ask Claude to translate: "translate this to Hebrew: שלום עולם"');
}

main();
