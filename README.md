# Hebrew Token Saver - Hybrid Translation Solution

## Problem Solved

| Issue | MyMemory API | Local Model (Transformers.js) | Hybrid Solution |
|-------|--------------|-------------------------------|-----------------|
| **Daily limit** | 1000 words/day | ❌ No limit | ✅ Falls back to local |
| **Size limit** | 1000 chars/request | ❌ No limit | ✅ Chunking + local |
| **Requires internet** | ✅ Yes | ❌ No | ✅ Optional |
| **Setup required** | ❌ None | ✅ 150MB download | ✅ Optional |
| **Speed** | ~100ms | ~200-500ms | ~100ms (API) / ~500ms (local) |

## Quick Start

### Option 1: API-Only (Simplest, Has Limits)

```bash
# No installation needed
node hebrew-translator.js "שלום עולם"
```

### Option 2: Hybrid (Recommended, No Limits)

```bash
# Install local model support (one-time, ~150MB)
npm install @xenova/transformers

# Run - automatically uses API first, falls back to local
node hebrew-translator-hybrid.js "שלום עולם"

# Force local-only (skip API entirely)
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

## How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                    HYBRID TRANSLATION PIPELINE                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User Input: "שלום עולם"                                        │
│         ↓                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Step 1: Detect Hebrew (≥20% Hebrew characters)          │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓                                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Step 2: Try MyMemory API                                │   │
│  │   - Fast (~100ms)                                       │   │
│  │   - Free (1000 words/day)                               │   │
│  │   - Limited to 1000 chars/request                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓  (if API fails or hits limit)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Step 3: Fall back to Local Model                        │   │
│  │   - Helsinki-NLP/opus-mt-he-en (150MB)                  │   │
│  │   - No limits, completely offline                       │   │
│  │   - Slower (~200-500ms) but unlimited                   │   │
│  │   - Auto-chunks large texts (>1000 chars)               │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓                                                        │
│  Output: "Hello world"                                          │
│         ↓                                                        │
│  Final Prompt: "Hello world . Important! Reply in Hebrew"      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Installation

### For Translation-Only (API)

```bash
# No installation needed - just run
node hebrew-translator.js "שלום עולם"
```

### For Hybrid (API + Local Fallback)

```bash
# Install Transformers.js
npm install @xenova/transformers

# First run will download the model (~150MB)
node hebrew-translator-hybrid.js "שלום עולם"
```

## Usage Examples

### Basic Translation

```bash
# API-only (simplest)
node hebrew-translator.js "שלום עולם"

# Hybrid (recommended)
node hebrew-translator-hybrid.js "שלום עולם"
```

### Response Language Options

```bash
# Force LLM to reply in English (instead of Hebrew)
node hebrew-translator.js "שלום עולם" --english

# Force RTL formatting for Hebrew output
node hebrew-translator.js "שלום עולם" --rtl

# These are incompatible:
node hebrew-translator.js "שלום עולם" --rtl --english
# Error: --rtl and --english options are incompatible.
```

### Force Local-Only (No API)

```bash
# Skip API, use local model only
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

### Large Text (>1000 chars)

```bash
# Hybrid automatically chunks large text
node hebrew-translator-hybrid.js "<long Hebrew text>"
```

### Programmatic Use

```javascript
const { processHebrewPrompt } = require('./hebrew-translator-hybrid.js');

async function example() {
  const result = await processHebrewPrompt("שלום עולם");
  
  console.log(result);
  // {
  //   original: "שלום עולם",
  //   isHebrew: true,
  //   translated: "Hello world",
  //   method: "api",  // or "local"
  //   finalPrompt: "Hello world . Important! Reply in Hebrew"
  // }
  
  // Send result.finalPrompt to your LLM
}
```

## Model Details

### Local Model: Helsinki-NLP/opus-mt-he-en

| Property | Value |
|----------|-------|
| **Size** | ~150MB |
| **Framework** | Transformers.js (@xenova/transformers) |
| **Quality** | Good for general text |
| **Speed** | ~200-500ms per request |
| **License** | Apache 2.0 |
| **Offline** | Yes, completely |

### Comparison: Local vs API

| Metric | MyMemory API | Local Model |
|--------|--------------|-------------|
| Speed | ~100ms | ~200-500ms |
| Quality | Good | Good |
| Limits | 1000 words/day | None |
| Size limit | 1000 chars | None (auto-chunked) |
| Internet | Required | Not required |
| Setup | None | 150MB download |

## Limitations & Workarounds

### MyMemory API Limitations

| Limitation | Workaround |
|------------|------------|
| 1000 words/day | Falls back to local model |
| 1000 chars/request | Auto-chunks large text |
| Requires internet | Falls back to local model |

### Local Model Limitations

| Limitation | Workaround |
|------------|------------|
| 150MB download | One-time, cached after first use |
| Slower than API | Only used when API fails |
| Requires Node.js | Part of the skill requirements |

## Files

| File | Description |
|------|-------------|
| `hebrew-translator.js` | API-only version (simplest) |
| `hebrew-translator-hybrid.js` | Hybrid version (recommended) |
| `package.json` | Dependencies |
| `SKILL.md` | Skill documentation |
| `research-local.md` | Research on local solutions |

## Testing

```bash
# Test Hebrew detection
node test.js

# Test API translation
node hebrew-translator.js "שלום עולם"

# Test hybrid translation
node hebrew-translator-hybrid.js "שלום עולם"

# Test local-only translation
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

## Expected Output

```bash
$ node hebrew-translator-hybrid.js "שלום עולם"

Original prompt:
שלום עולם

Detection result:
  Is Hebrew: Yes ✓

Translation:
  Hello world
  Method: API (or Local if API fails)

Final prompt (send to LLM):
Hello world . Important! Reply in Hebrew
```

## Summary

| Solution | Best For |
|----------|----------|
| **API-only** | Quick testing, low volume (<1000 words/day) |
| **Hybrid** | Production use, high volume, reliability |
| **Local-only** | Offline use, privacy, unlimited translation |

**Recommendation**: Use the hybrid solution. It gives you the best of both worlds:
- Fast API for small prompts
- Unlimited local fallback for large/prompts when API is unavailable
