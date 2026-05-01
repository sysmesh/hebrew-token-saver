# Installation — Hebrew Translator MCP Server

A zero-dependency, ~11 KB bundled server that auto-translates Hebrew prompts to English for Claude Code.

## Prerequisites

- Node.js 14+
- npm (bundled with Node)

## Quick Install — Claude Code

```bash
git clone https://github.com/sysmesh/hebrew-token-saver.git
cd hebrew-token-saver
npm install            # install build dependencies (esbuild)
npm run bundle         # create dist/hebrew-translator-mcp.js (zero deps, ~11 KB)
npm run install-claude # copy to ~/.claude/tools/, install skill, and configure settings.json
```

Restart Claude Code — the `hebrew_translate` tool and `/hebrew-translate` slash command will be available.

### What Happens Under the Hood

1. **`npm run bundle`** — esbuild bundles `hebrew-translator-mcp-server.js` into a single CommonJS file at `dist/hebrew-translator-mcp.js`. The output uses only Node built-ins, zero npm dependencies.
2. **`npm run install-claude`** — runs `install-claude.js`, which:
   - Copies the bundle to `~/.claude/tools/hebrew-translator-mcp.js`
   - Copies the slash command skill to `~/.claude/skills/claude-code/hebrew-translate.md`
   - Adds an MCP server entry to `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "hebrew-translator": {
      "command": "node",
      "args": ["~/.claude/tools/hebrew-translator-mcp.js"]
    }
  }
}
```

## Updating

Re-run the bundle and install whenever you pull changes:

```bash
git pull && npm run bundle && npm run install-claude
```

## Uninstall

Remove the `hebrew-translator` entry from `~/.claude/settings.json`, then:

```bash
rm ~/.claude/tools/hebrew-translator-mcp.js
```

## Verification

### Test the Bundle Exists

```bash
ls -la dist/hebrew-translator-mcp.js
# Should be ~11 KB, no imports of node_modules
```

### Test Hebrew Detection

```bash
node test.js
# Expected: all tests pass
```

### Test Translation

```bash
node hebrew-translator.js "שלום עולם"
# Expected output includes: "Hello world . Important! Reply in Hebrew"
```

## Troubleshooting

### "Bundled server not found at: dist/hebrew-translator-mcp.js"

Run `npm run bundle` first. If esbuild is missing, ensure you ran `npm install`.

### MCP Server Not Loading in Claude Code

1. Verify the file exists: `ls ~/.claude/tools/hebrew-translator-mcp.js`
2. Check settings.json has the entry: `cat ~/.claude/settings.json | grep hebrew`
3. Restart Claude Code fully (quit and relaunch)

### Translation API Quota Exceeded

The MyMemory API has a daily limit of 1000 words. Use the local model fallback:

```bash
npm install @xenova/transformers
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

## Files Structure (MCP Server)

```
hebrew-token-saver/
├── dist/
│   └── hebrew-translator-mcp.js      # Bundled, dependency-free server (~11 KB)
├── hebrew-translator-mcp-server.js   # MCP server source (ESM)
├── install-claude.js                  # Auto-installer script
├── lib/
│   └── common.js                      # Shared translation logic
└── package.json                       # Scripts: bundle, install-claude
```
