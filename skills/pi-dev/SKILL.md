# Hebrew Auto-Translate Skill for Pi.dev

## Metadata

```
name: hebrew-auto-translate
version: 1.0.0
platform: pi.dev
type: prompt-interceptor
author: Hebrew Token Saver
```

## Description

Automatically detects Hebrew prompts, translates them to English via the free MyMemory Translation API (or local model fallback), and sends them to the LLM with ". Important! Reply in Hebrew" appended. The LLM's Hebrew response is returned to the user.

## Features

- ✅ Auto-detects Hebrew text (≥20% Hebrew characters)
- ✅ Translates to English before sending to LLM
- ✅ Requests Hebrew response from LLM
- ✅ Saves up to 50% on input tokens
- ✅ Hybrid mode: API + local model fallback
- ✅ `--english` flag for English responses
- ✅ `--rtl` flag for RTL formatting

## Installation

```bash
# Copy skill to pi.dev skills directory
cp -r /path/to/hebrew-token-saver/skills/pi-dev ~/.pi/skills/hebrew-auto-translate

# The skill will auto-load on next pi.dev session
```

## Usage

### Automatic Mode (Default)

Simply type in Hebrew - the skill automatically handles everything:

```
User: איך מכינים חלבה?
↓ [Skill: Detect Hebrew → Translate → Append response request]
LLM receives: "How to make halva? . Important! Reply in Hebrew"
↓
LLM responds in Hebrew
```

### Manual Mode with Flags

```bash
# Force English response (saves more tokens)
/hebrew-translate --english "שלום עולם"

# Force RTL formatting
/hebrew-translate --rtl "שלום עולם"

# Force translation even if not detected as Hebrew
/hebrew-translate --force "mixed text שלום"
```

## Configuration

Add to `~/.pi/config.json`:

```json
{
  "skills": {
    "hebrew-auto-translate": {
      "enabled": true,
      "autoTranslate": true,
      "useHybridMode": false,
      "defaultResponseLanguage": "hebrew"
    }
  }
}
```

## Token Savings Example

| Prompt | Tokens (Hebrew) | Tokens (English) | Savings |
|--------|-----------------|------------------|---------|
| `שלום עולם` | 4 | 2 | 50% |
| `איך מכינים חלבה?` | 8 | 5 | 37.5% |

## API Used

- **Primary**: MyMemory Translation API (free, 1000 words/day)
- **Fallback**: Helsinki-NLP/opus-mt-he-en via Transformers.js (local, unlimited)

## Files Included

```
pi-dev/
├── SKILL.md          # This file
├── interceptor.js    # Prompt interception logic
├── translator.js     # Translation logic
└── package.json      # Dependencies
```

## Implementation Details

### Prompt Interceptor

```javascript
// Called before every user prompt is sent to LLM
export function interceptPrompt(prompt) {
  if (isHebrew(prompt)) {
    const translated = translateToEnglish(prompt);
    return `${translated}. Important! Reply in Hebrew`;
  }
  return prompt;
}
```

### Hebrew Detection

```javascript
export function isHebrew(text) {
  const hebrewChars = text.match(/[\u0590-\u05FF]/g);
  return hebrewChars && (hebrewChars.length / text.length) >= 0.2;
}
```

## License

MIT
