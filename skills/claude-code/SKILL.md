---
name: hebrew-translate
description: Use when the user types /hebrew-translate or asks to translate Hebrew to English. This skill provides the /hebrew-translate slash command for translating Hebrew prompts to English via the hebrew_translate MCP tool.
license: MIT
---

# Hebrew Translate Slash Command for Claude Code

## Description

This skill provides the `/hebrew-translate` slash command for Claude Code. It translates Hebrew prompts to English using the `hebrew_translate` MCP tool and appends a response language request.

## Installation

The skill is automatically installed when you run `npm run install-claude` in the hebrew-token-saver directory. This installs:
- MCP server at `~/.claude/tools/hebrew-translator-mcp.js`
- Skill configuration in `~/.claude/settings.json`

## Slash Command

Use `/hebrew-translate` to manually translate a Hebrew prompt:

```
/hebrew-translate "שלום עולם"
```

Options:
- `--english` — Request English response instead of Hebrew
- `--rtl` — Use RTL formatting for Hebrew output
- `--force` — Force translation even if not detected as Hebrew

Examples:
```
/hebrew-translate "שלום עולם"
/hebrew-translate "שלום עולם" --english
/hebrew-translate "שלום עולם" --rtl
/hebrew-translate "mixed text שלום" --force
```

## How to Handle /hebrew-translate

When the user invokes `/hebrew-translate`, call the `hebrew_translate` MCP tool with the following mapping:

| Slash Command Flag | Tool Parameter |
|--------------------|----------------|
| `--english` | `reply_in_english: true` |
| `--rtl` | `force_rtl: true` |
| `--force` | `force_translate: true` |

Example:
- User: `/hebrew-translate "שלום עולם" --english`
- Tool call: `hebrew_translate({ prompt: "שלום עולם", reply_in_english: true })`

## Automatic Mode

The MCP server will automatically detect Hebrew text and translate it when you type in Hebrew.

## Features

- Auto-detects Hebrew text (≥20% Hebrew characters)
- Translates to English before sending to LLM
- Requests Hebrew response from LLM
- Saves up to 50% on input tokens
- `--english` flag for English responses
- `--rtl` flag for RTL formatting
- `--force` flag to force translation

## Token Savings Example

| Prompt | Tokens (Hebrew) | Tokens (English) | Savings |
|--------|-----------------|------------------|---------|
| `שלום עולם` | 4 | 2 | 50% |
| `איך מכינים חלבה?` | 8 | 5 | 37.5% |

## API Used

- **Primary**: MyMemory Translation API (free, 1000 words/day)
- **Fallback**: Helsinki-NLP/opus-mt-he-en via Transformers.js (local, unlimited)

## Troubleshooting

- If `/hebrew-translate` is not recognized, restart Claude Code
- If translation fails, check your internet connection (MyMemory API required)
- API has a 1000 words/day limit
