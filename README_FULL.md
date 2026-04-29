# Hebrew Token Saver 🇮🇱 → 🇺🇸

> **Save tokens by translating Hebrew prompts to English before sending to LLMs, while receiving responses in Hebrew.**

---

## The Problem: Hebrew Costs More Tokens

Hebrew text requires significantly more tokens than English to express the same meaning. This is because:

1. **Character encoding**: Hebrew uses different Unicode ranges
2. **Morphology**: Hebrew words are more densely packed with meaning
3. **Tokenization**: LLM tokenizers are optimized for English

### Token Cost Comparison

| Prompt | Language | Tokens | Cost (at $0.01/1K tokens) |
|--------|----------|--------|---------------------------|
| `שלום עולם, איך מכינים חלבה?` | Hebrew | ~15-20 | $0.00015-0.00020 |
| `Hello world, how to make halva?` | English | ~8-10 | $0.00008-0.00010 |

**Savings: Up to 50% on input tokens!**

### Real-World Example

```bash
# Hebrew prompt (20 tokens)
"אני רוצה לכתוב תוכנית ב-JavaScript שמחשבת את מספרי פיבונאצ'
באופן רקורסיבי. האם תוכל לעזור לי עם זה?"

# Same prompt in English (12 tokens)
"I want to write a JavaScript program that calculates 
Fibonacci numbers recursively. Can you help me?"

Token savings: 40%
```

---

## The Solution: On-the-Fly Translation

**Hebrew Token Saver** automatically translates your Hebrew prompts to English before sending them to the LLM, then requests the response in Hebrew.

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOW IT WORKS                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. You type in Hebrew: "איך מכינים חלבה?"                  │
│                        ↓                                        │
│   2. Auto-detect Hebrew (≥20% Hebrew characters)              │
│                        ↓                                        │
│   3. Translate to English: "How to make halva?"              │
│                        ↓                                        │
│   4. Append: ". Important! Reply in Hebrew"                   │
│                        ↓                                        │
│   5. Send to LLM: "How to make halva? . Important! Reply in Hebrew" │
│                        ↓                                        │
│   6. LLM responds in Hebrew                                    │
│                        ↓                                        │
│   7. You receive: "חלבה היא ממתק ממוצא מזרחי..."            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation

### For Pi.dev

```bash
# Clone the repository
git clone https://github.com/your-username/hebrew-token-saver.git

# Copy to pi skills directory
cp -r hebrew-token-saver ~/.pi/skills/

# The skill will auto-load when you use pi
```

### For Claude Code

```bash
# Option 1: Add to tools directory
mkdir -p ~/.claude/tools
cp hebrew-translator.tool.json ~/.claude/tools/

# Option 2: Use as standalone script
npm install -g ./hebrew-token-saver

# Then use in your prompts:
hebrew-translate "שלום עולם"
```

### For Open Code

```bash
# Add to skills directory
cp -r hebrew-token-saver ~/.opencode/skills/

# Configure in settings.json:
{
  "skills": {
    "hebrew-token-saver": {
      "enabled": true,
      "autoTranslate": true
    }
  }
}
```

### Quick Start (Standalone)

```bash
# No installation needed - just run!
node hebrew-translator.js "שלום עולם"

# Or with npm
npm install ./hebrew-token-saver
npx hebrew-translate "שלום עולם"
```

---

## Usage

### Basic Usage

```bash
# Simple Hebrew prompt
node hebrew-translator.js "שלום עולם"

# Output:
# Original prompt:
# שלום עולם
#
# Detection result:
#   Is Hebrew: Yes ✓
#
# Translation:
#   Hello world
#
# Final prompt (send to LLM):
# Hello world . Important! Reply in Hebrew
```

### Force English Response (--english)

Use `--english` when you want the LLM to respond in English instead of Hebrew. This saves additional tokens on the response.

```bash
# Hebrew prompt, English response
node hebrew-translator.js "שלום עולם" --english

# Final prompt sent to LLM:
# Hello world . Important! Reply in English only

# Token savings: Input (40%) + Output (40%) = Up to 80% total savings!
```

### Force RTL Formatting (--rtl)

Use `--rtl` to force right-to-left formatting for Hebrew output using Unicode BIDI control characters.

```bash
# Hebrew prompt with RTL formatting
node hebrew-translator.js "שלום עולם" --rtl

# Final prompt sent to LLM:
# ‮שלום עולם. Important! Reply in Hebrew Use RTL formatting...‬

# The output will be properly formatted for Hebrew display
```

### Combining Options

```bash
# Force translation even if text is not detected as Hebrew
node hebrew-translator.js "Hi" --force

# Hybrid mode: API first, then local fallback
node hebrew-translator-hybrid.js "שלום עולם"

# Local-only mode (no API calls)
npm install @xenova/transformers
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

---

## Features

### Hebrew Detection

Automatically detects Hebrew text based on character percentage:

```javascript
// Detection algorithm
function isHebrew(text) {
  // Checks for Hebrew characters (Unicode U+0590-U+05FF)
  // Returns true if ≥20% of characters are Hebrew
}
```

### Translation Methods

| Method | Speed | Limits | Setup |
|--------|-------|--------|-------|
| **MyMemory API** | ~100ms | 1000 words/day | None |
| **Local Model** | ~500ms | Unlimited | 150MB download |
| **Hybrid** | ~100-500ms | Unlimited | Optional |

### Hybrid Mode (Recommended)

```bash
# Install local model support
npm install @xenova/transformers

# Run in hybrid mode (auto-fallback)
node hebrew-translator-hybrid.js "שלום עולם"

# Falls back to local model when:
# - API is unavailable
# - Daily limit is reached
# - Text is too long (>1000 chars)
```

---

## Token Savings Calculator

```javascript
// Example calculation
const hebrewPrompt = "איך מכינים חלבה?";
const englishPrompt = "How to make halva?";

// Approximate token counts
const hebrewTokens = 8;
const englishTokens = 5;

const savings = ((hebrewTokens - englishTokens) / hebrewTokens) * 100;
console.log(`Token savings: ${savings}%`); // 37.5%
```

### Real-World Savings

| Use Case | Hebrew Tokens | English Tokens | Savings |
|----------|---------------|----------------|---------|
| Simple greeting | 4 | 2 | 50% |
| Question | 8-10 | 5-6 | 37-40% |
| Complex request | 50-60 | 30-35 | 40-42% |
| Full conversation | 200-250 | 120-140 | 40-44% |

---

## API Reference

### Command-Line Interface

```bash
# Basic usage
hebrew-translate <prompt> [options]

# Options:
  --english     Force LLM to reply in English
  --rtl         Force RTL formatting for Hebrew output
  --force       Force translation even if not Hebrew
  --api-only    Use only MyMemory API (no local fallback)
  --local-only  Use only local model (skip API)

# Examples:
hebrew-translate "שלום עולם"
hebrew-translate "שלום עולם" --english
hebrew-translate "שלום עולם" --rtl
```

### Programmatic API

```javascript
const { processHebrewPrompt } = require('./hebrew-translator.js');

async function example() {
  const result = await processHebrewPrompt("שלום עולם", {
    replyInEnglish: false,  // Set to true for English response
    forceRTL: false,        // Set to true for RTL formatting
    forceTranslate: false   // Set to true to force translation
  });
  
  console.log(result);
  // {
  //   original: "שלום עולם",
  //   isHebrew: true,
  //   translated: "Hello world",
  //   finalPrompt: "Hello world . Important! Reply in Hebrew",
  //   responseLanguage: "Hebrew",
  //   rtlFormatted: false
  // }
  
  // Send result.finalPrompt to your LLM
}
```

---

## Technical Details

### Unicode BIDI Markers (RTL)

The `--rtl` option uses these Unicode characters:

| Name | Code | Character | Description |
|------|------|-----------|-------------|
| RLO | U+202E | `‮` | Right-to-Left Override |
| PDF | U+202C | `‬` | Pop Directional Formatting |
| FSI-R | U+2067 | `‌` | First Strong Isolate - RTL |

### Translation Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Hebrew    │→→→│   English   │→→→│   LLM       │
│   Input     │    │ Translation│    │ + Hebrew    │
│             │    │            │    │ Response    │
└─────────────┘    └─────────────┘    └─────────────┘
     ↓                  ↓                  ↓
  "שלום עולם"    "Hello world"    "שלום! איך..."
```

---

## Troubleshooting

### API Errors

```bash
# If MyMemory API is unavailable, use local fallback:
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

### Detection Issues

```bash
# Force translation if detection fails:
node hebrew-translator.js "mixed text שלום" --force
```

### RTL Display Issues

```bash
# If RTL formatting doesn't display correctly:
# Try without --rtl flag, or use a different terminal
node hebrew-translator.js "שלום עולם" --english
```

---

## License

MIT License - Feel free to use and modify.

---

## Credits

- **Translation API**: MyMemory Translation API
- **Local Model**: Helsinki-NLP/opus-mt-he-en via Transformers.js
- **Inspired by**: Hebrew RTL formatting techniques

---

# מחסם טוקנים עברי 🇮🇱 → 🇺🇸

> **חסכו טוקנים על ידי תרגום אוטומטי של פרומפטים מעברית לאנגלית לפני שליחה ל-LLM, תוך קבלת תשובות בעברית.**

---

## הבעיה: עברית עולה יותר טוקנים

טקסט בעברית דורש משמעותית יותר טוקנים מאנגלית כדי לבטא את אותו משמעות. הסיבות:

1. **קידוד תווים**: עברית משתמשת בטווחי Unicode שונים
2. **מורפולוגיה**: מילים עבריות צפופות יותר במשמעות
3. **טוקניזציה**: מזהה הטוקנים של LLMים מותאם לאנגלית

### השוואת עלות טוקנים

| פרומפט | שפה | טוקנים | עלות (ב-$0.01 ל-1K טוקנים) |
|--------|-----|--------|---------------------------|
| `שלום עולם, איך מכינים חלבה?` | עברית | ~15-20 | $0.00015-0.00020 |
| `Hello world, how to make halva?` | אנגלית | ~8-10 | $0.00008-0.00010 |

**חיסכון: עד 50% על טוקני קלט!**

### דוגמא מהעולם האמיתי

```bash
# פרומפט בעברית (20 טוקנים)
"אני רוצה לכתוב תוכנית ב-JavaScript שמחשבת את מספרי פיבונאצ'
באופן רקורסיבי. האם תוכל לעזור לי עם זה?"

# אותו פרומפט באנגלית (12 טוקנים)
"I want to write a JavaScript program that calculates 
Fibonacci numbers recursively. Can you help me?"

חיסכון בטוקנים: 40%
```

---

## הפתרון: תרגום אוטומטי

**מחסם טוקנים עברי** מתרגם אוטומטית את הפרומפטים העבריים שלך לאנגלית לפני השליחה ל-LLM, ואז מבקש את התשובה בעברית.

```
┌─────────────────────────────────────────────────────────────────┐
│                    איך זה עובד                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. אתה כותב בעברית: "איך מכינים חלבה?"                     │
│                        ↓                                        │
│   2. זיהוי אוטומטי של עברית (≥20% תווים עבריים)             │
│                        ↓                                        │
│   3. תרגום לאנגלית: "How to make halva?"                     │
│                        ↓                                        │
│   4. הוספת: ". Important! Reply in Hebrew"                    │
│                        ↓                                        │
│   5. שליחה ל-LLM: "How to make halva? . Important! Reply in Hebrew" │
│                        ↓                                        │
│   6. ה-LLM עונה בעברית                                        │
│                        ↓                                        │
│   7. אתה מקבל: "חלבה היא ממתק ממוצא מזרחי..."               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## התקנה

### עבור Pi.dev

```bash
# הורדת המאגר
git clone https://github.com/your-username/hebrew-token-saver.git

# העתקה לספריית הסקילים של pi
cp -r hebrew-token-saver ~/.pi/skills/

# הסקיל יטען אוטומטית כאשר תשתמש ב-pi
```

### עבור Claude Code

```bash
# אפשרות 1: הוספה לספריית הכלים
mkdir -p ~/.claude/tools
cp hebrew-translator.tool.json ~/.claude/tools/

# אפשרות 2: שימוש כסקריפט עצמאי
npm install -g ./hebrew-token-saver

# ואז שימוש בפרומפטים:
hebrew-translate "שלום עולם"
```

### עבור Open Code

```bash
# הוספה לספריית הסקילים
cp -r hebrew-token-saver ~/.opencode/skills/

# תצורה בקובץ settings.json:
{
  "skills": {
    "hebrew-token-saver": {
      "enabled": true,
      "autoTranslate": true
    }
  }
}
```

### התחלה מהירה (עצמאי)

```bash
# אין צורך בהתקנה - פשוט הרץ!
node hebrew-translator.js "שלום עולם"

# או עם npm
npm install ./hebrew-token-saver
npx hebrew-translate "שלום עולם"
```

---

## שימוש

### שימוש בסיסי

```bash
# פרומפט עברי פשוט
node hebrew-translator.js "שלום עולם"

# פלט:
# Original prompt:
# שלום עולם
#
# Detection result:
#   Is Hebrew: Yes ✓
#
# Translation:
#   Hello world
#
# Final prompt (send to LLM):
# Hello world . Important! Reply in Hebrew
```

### תשובה באנגלית (--english)

השתמש ב-`--english` כאשר אתה רוצה שה-LLM יענה באנגלית במקום עברית. זה חוסך טוקנים נוספים בתשובה.

```bash
# פרומפט עברי, תשובה באנגלית
node hebrew-translator.js "שלום עולם" --english

# הפרומפט הסופי שישלח ל-LLM:
# Hello world . Important! Reply in English only

# חיסכון בטוקנים: קלט (40%) + פלט (40%) = עד 80% חיסכון כולל!
```

### פורמט RTL (--rtl)

השתמש ב-`--rtl` כדי לאכוף פורמט ימין-לשמאל לתשובה העברית באמצעות תווים מיוחדים של Unicode BIDI.

```bash
# פרומפט עברי עם פורמט RTL
node hebrew-translator.js "שלום עולם" --rtl

# הפרומפט הסופי שישלח ל-LLM:
# ‮שלום עולם. Important! Reply in Hebrew Use RTL formatting...‬

# הפלט יוצג עם פורמט נכון לעברית
```

### שילוב אפשרויות

```bash
# אכיפת תרגום גם אם הטקסט לא זוהה כעברי
node hebrew-translator.js "Hi" --force

# מצב היברידי: API קודם, אחר כך מודל מקומי
node hebrew-translator-hybrid.js "שלום עולם"

# מצב מקומי בלבד (ללא קריאות API)
npm install @xenova/transformers
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

---

## תכונות

### זיהוי עברית

זיהוי אוטומטי של טקסט עברי על בסיס אחוז התווים:

```javascript
// אלגוריתם זיהוי
function isHebrew(text) {
  // בודק תווים עבריים (Unicode U+0590-U+05FF)
  // מחזיר true אם ≥20% מהתווים הם עבריים
}
```

### שיטות תרגום

| שיטה | מהירות | מגבלות | התקנה |
|------|--------|--------|-------|
| **MyMemory API** | ~100ms | 1000 מילים/יום | ללא |
| **מודל מקומי** | ~500ms | ללא מגבלות | 150MB הורדה |
| **היברידי** | ~100-500ms | ללא מגבלות | אופציונלי |

### מצב היברידי (מומלץ)

```bash
# התקנת תמיכה במודל מקומי
npm install @xenova/transformers

# הרצה במצב היברידי (fallback אוטומטי)
node hebrew-translator-hybrid.js "שלום עולם"

# חוזר למודל המקומי כאשר:
# - API לא זמין
# - הגעת למגבלה היומית
# - הטקסט ארוך מדי (>1000 תווים)
```

---

## מחשבון חיסכון בטוקנים

```javascript
// דוגמא לחישוב
const hebrewPrompt = "איך מכינים חלבה?";
const englishPrompt = "How to make halva?";

// ספירת טוקנים משוערת
const hebrewTokens = 8;
const englishTokens = 5;

const savings = ((hebrewTokens - englishTokens) / hebrewTokens) * 100;
console.log(`Token savings: ${savings}%`); // 37.5%
```

### חיסכון מהעולם האמיתי

| מקרה שימוש | טוקנים עבריים | טוקנים באנגלית | חיסכון |
|------------|----------------|-----------------|--------|
| ברכה פשוטה | 4 | 2 | 50% |
| שאלה | 8-10 | 5-6 | 37-40% |
| בקשה מורכבת | 50-60 | 30-35 | 40-42% |
| שיחה מלאה | 200-250 | 120-140 | 40-44% |

---

## API Reference

### Command-Line Interface

```bash
# שימוש בסיסי
hebrew-translate <prompt> [options]

# אפשרויות:
  --english     אכוף ל-LLM לענות באנגלית
  --rtl         אכוף פורמט RTL לפלט עברי
  --force       אכוף תרגום גם אם לא עברית
  --api-only    השתמש רק ב-MyMemory API (ללא fallback מקומי)
  --local-only  השתמש רק במודל המקומי (דלג על API)

# דוגמאות:
hebrew-translate "שלום עולם"
hebrew-translate "שלום עולם" --english
hebrew-translate "שלום עולם" --rtl
```

### Programmatic API

```javascript
const { processHebrewPrompt } = require('./hebrew-translator.js');

async function example() {
  const result = await processHebrewPrompt("שלום עולם", {
    replyInEnglish: false,  // הגדר ל-true לתשובה באנגלית
    forceRTL: false,        // הגדר ל-true לפורמט RTL
    forceTranslate: false   // הגדר ל-true לאכיפת תרגום
  });
  
  console.log(result);
  // {
  //   original: "שלום עולם",
  //   isHebrew: true,
  //   translated: "Hello world",
  //   finalPrompt: "Hello world . Important! Reply in Hebrew",
  //   responseLanguage: "Hebrew",
  //   rtlFormatted: false
  // }
  
  // שלח את result.finalPrompt ל-LLM שלך
}
```

---

## פרטים טכניים

### תווים Unicode BIDI (RTL)

האופציה `--rtl` משתמשת בתווים אלו של Unicode:

| שם | קוד | תו | תיאור |
|----|-----|-----|-------|
| RLO | U+202E | `‮` | Right-to-Left Override |
| PDF | U+202C | `‬` | Pop Directional Formatting |
| FSI-R | U+2067 | `‌` | First Strong Isolate - RTL |

### צינור תרגום

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   עברית     │→→→│   אנגלית    │→→→│   LLM       │
│   קלט       │    │  תרגום      │    │ + תשובה    │
│             │    │             │    │  עברית      │
└─────────────┘    └─────────────┘    └─────────────┘
     ↓                  ↓                  ↓
  "שלום עולם"    "Hello world"    "שלום! איך..."
```

---

## פתרון בעיות

### שגיאות API

```bash
# אם MyMemory API לא זמין, השתמש ב-fallback מקומי:
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

### בעיות זיהוי

```bash
# אכוף תרגום אם הזיהוי נכשל:
node hebrew-translator.js "mixed text שלום" --force
```

### בעיות תצוגה RTL

```bash
# אם פורמט RTL לא מוצג נכון:
# נסה ללא דגל --rtl, או השתמש בטרמינל אחר
node hebrew-translator.js "שלום עולם" --english
```

---

## רישיון

MIT License - חופשי לשימוש ושינוי.

---

## קרדיטים

- **Translation API**: MyMemory Translation API
- **Local Model**: Helsinki-NLP/opus-mt-he-en via Transformers.js
- **Inspired by**: Hebrew RTL formatting techniques

