# Hebrew Auto-Translate Skill

## Description

Automatically detects Hebrew prompts, translates them to English via the free MyMemory Translation API, and sends them to the LLM with ". Important! Reply in Hebrew" appended. The LLM's Hebrew response is returned to the user.

## How It Works

```
User Hebrew Prompt
        ↓
  Detect Hebrew
        ↓
Translate to English (MyMemory API)
        ↓
Append: ". Important! Reply in Hebrew"
        ↓
Send to LLM
        ↓
LLM replies in Hebrew
        ↓
User receives Hebrew response
```

## Translation Methods

### Method 1: MyMemory API (Default)

**MyMemory Translation API** (https://www.mymemory.net/api/)
- Free, no API key required
- 1000 words/day limit
- 1000 chars/request limit
- Fast (~100ms response time)

### Method 2: Local Model (Fallback)

**Helsinki-NLP/opus-mt-he-en** via Transformers.js
- Completely offline, no limits
- ~150MB model download
- Slower (~200-500ms per request)
- No daily or size restrictions

### Hybrid Approach (Recommended)

The hybrid version (`hebrew-translator-hybrid.js`) automatically:
1. Tries MyMemory API first (fast, no setup)
2. Falls back to local model if API fails or hits limits
3. Handles large texts by chunking (>1000 chars)

```bash
# Install dependencies for local translation
npm install @xenova/transformers

# Use hybrid mode
node hebrew-translator-hybrid.js "שלום עולם"

# Force local-only (skip API)
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

## Installation

### For pi.dev

1. Copy this skill directory to your pi skills folder:
   ```bash
   cp -r hebrew-token-saver ~/.pi/skills/
   ```

2. The skill will auto-load when you use pi.

### For ClaudeCode

1. Add the `hebrewTranslator` tool to your ClaudeCode configuration
2. Or use the standalone script: `node hebrew-translate.js "your Hebrew prompt"`

### For opencode

1. Add the skill to your opencode skills directory
2. Configure the prompt interceptor in your settings

## Usage

Simply type your prompt in Hebrew. The skill automatically:
1. Detects Hebrew text
2. Translates to English
3. Sends to LLM with Hebrew response request
4. Returns the Hebrew response

### Example

**User types (Hebrew):**
```
איך מכינים חלבה?
```

**Internal process:**
1. Detects Hebrew ✓
2. Translates: "How to make halva?"
3. Sends to LLM: "How to make halva? . Important! Reply in Hebrew"
4. LLM responds in Hebrew

**User receives (Hebrew):**
```
חלבה היא ממתק ממוצא מזרחי... (recipe in Hebrew)
```

### Options

| Flag | Description | Example |
|------|-------------|---------|
| `--english` | LLM replies in English instead of Hebrew | `node hebrew-translator.js "שלום" --english` |
| `--rtl` | Forces RTL formatting for Hebrew output | `node hebrew-translator.js "שלום" --rtl` |
| `--force` | Forces translation even if not Hebrew | `node hebrew-translator.js "Hi" --force` |

### RTL Formatting

The `--rtl` flag wraps Hebrew output with Unicode BIDI control characters:
- **RLO (U+202E)**: Right-to-Left Override
- **PDF (U+202C)**: Pop Directional Formatting

This ensures proper Hebrew display in all contexts, especially when mixed with Latin text.

```bash
# Without RTL
node hebrew-translator.js "שלום עולם"
# Output: שלום עולם. Important! Reply in Hebrew

# With RTL
node hebrew-translator.js "שלום עולם" --rtl
# Output: ‮שלום עולם. Important! Reply in Hebrew Use RTL formatting...‬
```

**Note**: `--rtl` and `--english` are incompatible (RTL only makes sense for Hebrew output).

## Configuration

### Environment Variables

```bash
# Optional: Custom translation API endpoint
HEBREW_TRANSLATE_API="https://api.mymemory.net/api/transliterate"

# Optional: Force translation (skip Hebrew detection)
FORCE_HEBREW_TRANSLATE="true"
```

### API Rate Limiting

If you hit the 1000 words/day limit, the API returns an error. The skill will:
1. Log the error
2. Fall back to sending the original Hebrew prompt
3. Add a warning to the user

## Files

- `SKILL.md` - This documentation
- `hebrew-translator.js` - Core translation logic (Node.js)
- `hebrew-translator.tool.json` - Tool definition for agent frameworks
- `package.json` - Dependencies (none required - zero dependencies!)

## Testing

```bash
# Test the translator
node hebrew-translator.js "שלום עולם"

# Expected output:
# {
#   "original": "שלום עולם",
#   "translated": "Hello world",
#   "finalPrompt": "Hello world . Important! Reply in Hebrew"
# }
```

## Limitations

1. **1000 words/day** - Free tier limit on MyMemory API
2. **Short text only** - API has 1000 character limit per request
3. **No context** - Each translation is independent
4. **Internet required** - API calls require network access

## Alternatives for Heavy Use

For production/heavy use, consider:
- **Google Translate API** - $20/1M characters
- **Microsoft Translator** - $0.0002/1000 characters
- **DeepL API** - High quality, free tier available

## License

MIT - Feel free to use and modify.
