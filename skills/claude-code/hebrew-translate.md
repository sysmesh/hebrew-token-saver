---
description: Translate Hebrew prompts to English and request responses in Hebrew or English
argument-hint: "prompt" [--english] [--rtl] [--force]
allowed-tools: [Bash]
---

# Hebrew Translate

Translate Hebrew prompts to English and request responses in Hebrew or English.

## Arguments

The user invoked this command with: $ARGUMENTS

## Instructions

When this command is invoked, call the `hebrew_translate` MCP tool with the following mapping:

| Slash Command Flag | Tool Parameter |
|--------------------|----------------|
| `--english` | `reply_in_english: true` |
| `--rtl` | `force_rtl: true` |
| `--force` | `force_translate: true` |

Parse the user's arguments to extract:
1. The prompt text (required)
2. Any flags (`--english`, `--rtl`, `--force`)

Then call the `hebrew_translate` tool with the parsed arguments.

Display the translation result to the user, including:
- Original text
- Translated text (if Hebrew detected)
- Final prompt to send to the LLM
- Response language
- Token savings estimate

If the text is not detected as Hebrew, inform the user and return the original text unchanged.
