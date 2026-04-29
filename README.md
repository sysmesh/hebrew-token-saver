# Hebrew Token Saver 🇮🇱 → 🇺🇸

> **Save tokens by translating Hebrew prompts to English before sending to LLMs, while receiving responses in Hebrew.**

---

## The Problem: Hebrew Costs More Tokens

Hebrew text requires significantly more tokens than English to express the same meaning. This is because:

1. **Character encoding**: Hebrew uses different Unicode ranges
2. **Morphology**: Hebrew words are more densely packed with meaning
3. **Tokenization**: LLM tokenizers are optimized for English

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
│   1. You type in Hebrew: "הסבר לי את הלולאה בשורה 100"      │
│                        ↓                                        │
│   2. Auto-detect Hebrew (≥20% Hebrew characters)              │
│                        ↓                                        │
│   3. Translate to English: "Explain the loop in line 100"     │
│                        ↓                                        │
│   4. Append: ". Important! Reply in Hebrew"                   │
│                        ↓                                        │
│   5. Send to LLM: "Explain the loop in line 100 . Important! Reply in Hebrew" │
│                        ↓                                        │
│   6. LLM responds in Hebrew                                    │
│                        ↓                                        │
│   7. You receive: "בשורה 100 יש לולאת for שמתירה על..."     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation & Usage by Platform

### 🟦 Pi.dev

#### Installation

```bash
# 1. Clone or download the repository
git clone https://github.com/your-username/hebrew-token-saver.git

# 2. Copy the Pi.dev skill to your skills directory
cp -r hebrew-token-saver/skills/pi-dev ~/.pi/skills/hebrew-auto-translate

# 3. Verify installation
ls -la ~/.pi/skills/hebrew-auto-translate/

# 4. Restart pi.dev (if running)
# The skill will auto-load on next session
```

#### Usage

**Automatic Mode (Default):**

Simply type in Hebrew - the skill automatically handles everything:

```
> איך מכינים חלבה?

[Skill automatically: Detects Hebrew → Translates → Sends to LLM]
[LLM responds in Hebrew]
```

**Manual Mode with Flags:**

```bash
# Force English response (saves more tokens)
> /hebrew-translate --english "שלום עולם"

# Force RTL formatting
> /hebrew-translate --rtl "שלום עולם"

# Force translation even if not detected as Hebrew
> /hebrew-translate --force "mixed text שלום"
```

**Configuration (Optional):**

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

---

### 🟨 Claude Code

#### Installation

```bash
# 1. Create tools directory if it doesn't exist
mkdir -p ~/.claude/tools

# 2. Copy the tool files
cp hebrew-token-saver/skills/claude-code/hebrew-translator-mcp.js ~/.claude/tools/
cp hebrew-token-saver/skills/claude-code/hebrew-translator.tool.json ~/.claude/tools/

# 3. Verify installation
ls -la ~/.claude/tools/hebrew-translator*

# 4. Restart Claude Code
```

#### Usage

**Using the Tool Directly:**

```bash
# Basic translation
/tool hebrew_translator --prompt "שלום עולם"

# Request English response
/tool hebrew_translator --prompt "שלום עולם" --reply-in-english

# Request RTL formatting
/tool hebrew_translator --prompt "שלום עולם" --force-rtl
```

**Example Output:**

```json
{
  "success": true,
  "is_hebrew": true,
  "original": "שלום עולם",
  "translated": "Hello world",
  "final_prompt": "Hello world . Important! Reply in Hebrew",
  "response_language": "Hebrew",
  "token_savings_estimate": "Up to 40% on input tokens"
}
```

**Then send `final_prompt` to the LLM:**

```bash
# Copy the final_prompt and use it in your LLM call
"Hello world . Important! Reply in Hebrew"
```

---

### 🟩 OpenCode

#### Installation

```bash
# 1. Copy the skill directory
cp -r hebrew-token-saver/skills/opencode ~/.opencode/skills/hebrew-auto-translate

# 2. Verify installation
ls -la ~/.opencode/skills/hebrew-auto-translate/

# 3. Configure in settings.json (optional)
cat >> ~/.opencode/settings.json << 'EOF'
{
  "skills": {
    "hebrew-auto-translate": {
      "enabled": true,
      "autoTranslate": true,
      "responseLanguage": "hebrew",
      "useRtlFormatting": false
    }
  }
}
EOF

# 4. Restart OpenCode
```

#### Usage

**Automatic Mode (Default):**

Just type in Hebrew - the skill automatically handles everything:

```
> איך מכינים חלבה?

[Skill automatically: Detects Hebrew → Translates → Sends to LLM]
[LLM responds in Hebrew]
```

**Manual Mode:**

```bash
# Basic translation
> /hebrew-translate "שלום עולם"

# Request English response
> /hebrew-translate "שלום עולם" --english

# Request RTL formatting
> /hebrew-translate "שלום עולם" --rtl

# Force translation
> /hebrew-translate "mixed text שלום" --force
```

**Example Output:**

```
=== Hebrew Translation ===
Original: שלום עולם
Translated: Hello world
Response Language: Hebrew
Token Savings: Up to 40% on input tokens

Final Prompt: Hello world . Important! Reply in Hebrew
=========================
```

---

## Features

### Command-Line Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--english` | LLM replies in English instead of Hebrew | `hebrew-translate "שלום" --english` |
| `--rtl` | Forces RTL formatting for Hebrew output | `hebrew-translate "שלום" --rtl` |
| `--force` | Forces translation even if not Hebrew | `hebrew-translate "Hi" --force` |
| `--api-only` | Use only MyMemory API (no local fallback) | `hebrew-translate --api-only "שלום"` |
| `--local-only` | Use only local model (skip API) | `hebrew-translate --local-only "שלום"` |

### Flag Combinations

```bash
# These are incompatible:
hebrew-translate "שלום עולם" --rtl --english
# Error: --rtl and --english options are incompatible.
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

## API Reference

### Command-Line Interface

```bash
# Basic usage
hebrew-translate <prompt> [options]

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
│   1. אתה כותב בעברית: "הסבר לי את הלולאה בשורה 100"         │
│                        ↓                                        │
│   2. זיהוי אוטומטי של עברית (≥20% תווים עבריים)             │
│                        ↓                                        │
│   3. תרגום לאנגלית: "Explain the loop in line 100"           │
│                        ↓                                        │
│   4. הוספת: ". Important! Reply in Hebrew"                    │
│                        ↓                                        │
│   5. שליחה ל-LLM: "Explain the loop in line 100 . Important! Reply in Hebrew" │
│                        ↓                                        │
│   6. ה-LLM עונה בעברית                                        │
│                        ↓                                        │
│   7. אתה מקבל: "בשורה 100 יש לולאת for שמתירה על..."       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## התקנה ושימוש לפי פלטפורמה

### 🟦 Pi.dev

#### התקנה

```bash
# 1. הורדת המאגר
git clone https://github.com/your-username/hebrew-token-saver.git

# 2. העתקת סקיל Pi.dev לספריית הסקילים
cp -r hebrew-token-saver/skills/pi-dev ~/.pi/skills/hebrew-auto-translate

# 3. אימות ההתקנה
ls -la ~/.pi/skills/hebrew-auto-translate/

# 4. הפעלה מחדש של pi.dev (אם רץ)
# הסקיל יטען אוטומטית בסיבוב הבא
```

#### שימוש

**מצב אוטומטי (ברירת מחדל):**

פשוט כתוב בעברית - הסקיל מטפל בהכל אוטומטית:

```
> איך מכינים חלבה?

[הסקיל אוטומטית: מזדהה עברית → מתרגם → שולח ל-LLM]
[ה-LLM עונה בעברית]
```

**מצב ידני עם דגלים:**

```bash
# אכוף תשובה באנגלית (חוסך יותר טוקנים)
> /hebrew-translate --english "שלום עולם"

# אכוף פורמט RTL
> /hebrew-translate --rtl "שלום עולם"

# אכוף תרגום גם אם לא זוהה כעברית
> /hebrew-translate --force "mixed text שלום"
```

**תצורה (אופציונלי):**

הוסף ל-`~/.pi/config.json`:

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

---

### 🟨 Claude Code

#### התקנה

```bash
# 1. יצירת ספריית כלים אם היא לא קיימת
mkdir -p ~/.claude/tools

# 2. העתקת קבצי הכלי
cp hebrew-token-saver/skills/claude-code/hebrew-translator-mcp.js ~/.claude/tools/
cp hebrew-token-saver/skills/claude-code/hebrew-translator.tool.json ~/.claude/tools/

# 3. אימות ההתקנה
ls -la ~/.claude/tools/hebrew-translator*

# 4. הפעלה מחדש של Claude Code
```

#### שימוש

**שימוש בכלי ישירות:**

```bash
# תרגום בסיסי
/tool hebrew_translator --prompt "שלום עולם"

# בקשת תשובה באנגלית
/tool hebrew_translator --prompt "שלום עולם" --reply-in-english

# בקשת פורמט RTL
/tool hebrew_translator --prompt "שלום עולם" --force-rtl
```

**דוגמת פלט:**

```json
{
  "success": true,
  "is_hebrew": true,
  "original": "שלום עולם",
  "translated": "Hello world",
  "final_prompt": "Hello world . Important! Reply in Hebrew",
  "response_language": "Hebrew",
  "token_savings_estimate": "Up to 40% on input tokens"
}
```

**אז שלח את `final_prompt` ל-LLM:**

```bash
# העתק את final_prompt ושתמש בו בקריאה ל-LLM שלך
"Hello world . Important! Reply in Hebrew"
```

---

### 🟩 OpenCode

#### התקנה

```bash
# 1. העתקת ספריית הסקיל
cp -r hebrew-token-saver/skills/opencode ~/.opencode/skills/hebrew-auto-translate

# 2. אימות ההתקנה
ls -la ~/.opencode/skills/hebrew-auto-translate/

# 3. תצורה בקובץ settings.json (אופציונלי)
cat >> ~/.opencode/settings.json << 'EOF'
{
  "skills": {
    "hebrew-auto-translate": {
      "enabled": true,
      "autoTranslate": true,
      "responseLanguage": "hebrew",
      "useRtlFormatting": false
    }
  }
}
EOF

# 4. הפעלה מחדש של OpenCode
```

#### שימוש

**מצב אוטומטי (ברירת מחדל):**

פשוט כתוב בעברית - הסקיל מטפל בהכל אוטומטית:

```
> איך מכינים חלבה?

[הסקיל אוטומטית: מזדהה עברית → מתרגם → שולח ל-LLM]
[ה-LLM עונה בעברית]
```

**מצב ידני:**

```bash
# תרגום בסיסי
> /hebrew-translate "שלום עולם"

# בקשת תשובה באנגלית
> /hebrew-translate "שלום עולם" --english

# בקשת פורמט RTL
> /hebrew-translate "שלום עולם" --rtl

# אכיפת תרגום
> /hebrew-translate "mixed text שלום" --force
```

**דוגמת פלט:**

```
=== Hebrew Translation ===
Original: שלום עולם
Translated: Hello world
Response Language: Hebrew
Token Savings: Up to 40% on input tokens

Final Prompt: Hello world . Important! Reply in Hebrew
=========================
```

---

## תכונות

### דגלי שורת פקודה

| דגל | תיאור | דוגמא |
|-----|-------|-------|
| `--english` | ה-LLM עונה באנגלית במקום עברית | `hebrew-translate "שלום" --english` |
| `--rtl` | מאכוף פורמט RTL לפלט עברי | `hebrew-translate "שלום" --rtl` |
| `--force` | מאכוף תרגום גם אם לא עברית | `hebrew-translate "Hi" --force` |
| `--api-only` | השתמש רק ב-MyMemory API (ללא fallback מקומי) | `hebrew-translate --api-only "שלום"` |
| `--local-only` | השתמש רק במודל המקומי (דלג על API) | `hebrew-translate --local-only "שלום"` |

### שילובי דגלים

```bash
# אלו לא תואמים:
hebrew-translate "שלום עולם" --rtl --english
# שגיאה: --rtl ו- --english אינם תואמים.
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

## API Reference

### Command-Line Interface

```bash
# שימוש בסיסי
hebrew-translate <prompt> [options]

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

