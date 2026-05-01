# Installation — Hebrew Translator MCP Server

A zero-dependency, ~11 KB bundled server that auto-translates Hebrew prompts to English for Claude Code.

## Quick Install — `npx -y` (Recommended)

Zero config, zero install — one line:

```bash
claude mcp add hebrew-translator -- npx -y hebrew-token-saver
```

Restart Claude Code — the `hebrew_translate` tool and `/hebrew-translate` slash command will be available.

**How it works:**

1. `claude mcp add` registers the server in `~/.claude/settings.json`
2. `npx -y` fetches the package from npm on first use — no files left on disk, no config files generated
3. The package's `bin` field points to the pre-bundled MCP server (`dist/hebrew-translator-mcp.js`), a single ~11 KB file with zero dependencies

## Manual Install — Source

For those who prefer source-based installation:

```bash
git clone https://github.com/sysmesh/hebrew-token-saver.git
cd hebrew-token-saver
npm install            # install build dependencies (esbuild)
npm run bundle         # create dist/hebrew-translator-mcp.js (zero deps, ~11 KB)
npx -y hebrew-token-saver claude mcp add hebrew-translator -- node dist/hebrew-translator-mcp.js
```

## Updating

```bash
git pull && npm run bundle
# No re-install needed — npx always fetches the latest on first use per session
```

## Uninstall

```bash
claude mcp remove hebrew-translator
```

## Verification

```bash
# Test translation
npx -y hebrew-token-saver demo

# Test Hebrew detection
node test.js

# Test translation
npx -y hebrew-token-saver demo
```

## Troubleshooting

### MCP Server Not Loading in Claude Code

1. Verify it's registered: `claude mcp list | grep hebrew`
2. Test the bundle directly: `npx -y hebrew-token-saver demo`
3. Restart Claude Code fully (quit and relaunch)

### Translation API Quota Exceeded

The MyMemory API has a daily limit of 1000 words. Use the local model fallback:

```bash
npm install @xenova/transformers
npx -y hebrew-token-saver demo-hybrid
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
