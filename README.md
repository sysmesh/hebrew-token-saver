# Hebrew Token Saver 🇮🇱 → 🇺🇸


> **הידעתם? שימוש בעברית בפרומפט מייצר כמות גדולה משמעותית של טוקנים יחסית לשימוש באנגלית בלבד**

> **התוסף מאפשר לכם לכתוב פרופמט בעברית כאשר התוסך מבצע עבורכם תרגום נכון לאנגלית ושולח את האנגלית הלאה עם הוראה למודל להחזיר גם את התשובה בעברית וכך חוסך לכם המון טוקנים**

> **רוצים לחסוך עוד יותר? יש אפשרות לאמר לתוסף לענות באנגלית מה שחוסך לכם את הטוקנים שחוזרים מהמודל**

> **חדש! תמיכה ביישור ימין לשמאל אם זה חשוב לכם - על ידי הוספת הגדרה בקריאה - הכל בתיעוד למטה**

> **Save tokens by translating Hebrew prompts to English before sending to LLMs, while receiving responses in Hebrew.**
---

## The Problem: Hebrew Costs More Tokens
## הבעיה: עברית עולה יותר טוקנים

Hebrew text requires significantly more tokens than English to express the same meaning. This is because:
טקסט בעברית דורש משמעותית יותר טוקנים מאנגלית כדי לבטא את אותו משמעות. הסיבות:

1. **Character encoding**: Hebrew uses different Unicode ranges
1. **קידוד תווים**: עברית משתמשת בטווחי Unicode שונים

2. **Morphology**: Hebrew words are more densely packed with meaning
2. **מורפולוגיה**: מילים עבריות צפופות יותר במשמעות

3. **Tokenization**: LLM tokenizers are optimized for English
3. **טוקניזציה**: מזהה הטוקנים של LLMים מותאם לאנגלית

### Real-World Example
### דוגמא מהעולם האמיתי

```bash
# Hebrew prompt (20 tokens)
# פרומפט בעברית (20 טוקנים)
"אני רוצה לכתוב תוכנית ב-JavaScript שמחשבת את מספרי פיבונאצ'
באופן רקורסיבי. האם תוכל לעזור לי עם זה?"

# Same prompt in English (12 tokens)
# אותו פרומפט באנגלית (12 טוקנים)
"I want to write a JavaScript program that calculates
Fibonacci numbers recursively. Can you help me?"

Token savings: 40%
חיסכון בטוקנים: 40%
```

---

## The Solution: On-the-Fly Translation
## הפתרון: תרגום אוטומטי

**Hebrew Token Saver** automatically translates your Hebrew prompts to English before sending them to the LLM, then requests the response in Hebrew.
**מחסם טוקנים עברי** מתרגם אוטומטית את הפרומפטים העבריים שלך לאנגלית לפני השליחה ל-LLM, ואז מבקש את התשובה בעברית.

```
┌─────────────────────────────────────────────────────────────────┐
│                    HOW IT WORKS                    איך זה עובד  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. You type in Hebrew / אתה כותב בעברית: "הסבר לי את הלולאה  │
│      בשורה 100"                                                │
│                        ↓                                        │
│   2. Auto-detect Hebrew (≥20% Hebrew characters)               │
│      זיהוי אוטומטי של עברית (≥20% תווים עבריים)               │
│                        ↓                                        │
│   3. Translate to English / תרגום לאנגלית:                      │
│      "Explain the loop in line 100"                             │
│                        ↓                                        │
│   4. Append / הוספת:                                            │
│      ". Important! Reply in Hebrew"                             │
│                        ↓                                        │
│   5. Send to LLM / שליחה ל-LLM:                                 │
│      "Explain the loop in line 100 . Important! Reply in Hebrew"│
│                        ↓                                        │
│   6. LLM responds in Hebrew / ה-LLM עונה בעברית                │
│                        ↓                                        │
│   7. You receive / אתה מקבל: "בשורה 100 יש לולאת for שמתירה   │
│      על..."                                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation & Usage by Platform
## התקנה ושימוש לפי פלטפורמה

### 🟨 Claude Code (MCP Server)
### 🟨 Claude Code (שרת MCP)

A zero-dependency, ~11 KB bundled server that auto-translates Hebrew prompts to English for Claude Code.
שרת מקומי ללא תלות, ~11 KB, המתרגם אוטומטית פרומפטים מעברית לאנגלית עבור Claude Code.

#### Prerequisites / דרישות מוקדמות

- Node.js 14+ (for `npx` / עבור `npx`)

#### Quick Install — `npx -y` (Recommended)
#### התקנה מהירה — `npx -y` (מומלץ)

One line, fully automatic — the server self-registers on first run:
שורה אחת — השרת מתקין את עצמו אוטומטית בשימוש הראשון:

```bash
claude mcp add hebrew-translator -- npx -y hebrew-token-saver
```

That's it. Restart Claude Code — the `hebrew_translate` tool and `/hebrew-translate` slash command will be available.
זהו. הפעל מחדש את Claude Code — הכלי `hebrew_translate` ופקודת ה-/hebrew-translate יהיו זמינים.

**How it works / איך זה עובד:**
1. `npx -y` fetches the package from npm on first use — no files left on disk
   `npx -y` משיג את החבילה מ-npx בשימוש הראשון — ללא קבצים על הדיסק
2. The CLI automatically copies itself to `~/.claude/tools/` and registers in `~/.claude/settings.json`
   השרת מתקין את עצמו אוטומטית ל-`~/.claude/tools/` ונרשם ב-`settings.json`
3. Restart Claude Code — the `hebrew_translate` tool and `/hebrew-translate` slash command will be available
   הפעל מחדש את Claude Code — הכלי `hebrew_translate` ופקודת ה-/hebrew-translate יהיו זמינים

#### Manual Install — Source
#### התקנה ידנית — מקור

For those who prefer source-based installation:
למי שמעדיף התקנה מקודם:

```bash
git clone https://github.com/sysmesh/hebrew-token-saver.git
cd hebrew-token-saver
npm install            # install build dependencies (esbuild) / התקנת תלויות בנייה
npm run bundle         # create dist/hebrew-translator-mcp.js (zero deps, ~11 KB)
npx -y hebrew-token-saver claude mcp add hebrew-translator -- node dist/hebrew-translator-mcp.js
```

#### Updating / עדכון

```bash
git pull && npm run bundle
# No re-install needed — npx always fetches the latest on first use per session
# לא צריך להתקין מחדש — npx תמיד משיג את הגרסה האחרונה בכל סשן
```

#### Uninstall / הסרה

```bash
claude mcp remove hebrew-translator
```

#### Verification / אימות

```bash
# Test translation / בדיקת תרגום
npx -y hebrew-token-saver demo

# Test Hebrew detection / בדיקת זיהוי עברית
node test.js
```

#### Troubleshooting / פתרון בעיות

**MCP Server Not Loading in Claude Code / שרת MCP לא נטען ב-Claude Code**

1. Verify it's registered: `claude mcp list | grep hebrew`
   ודא שרשום: `claude mcp list | grep hebrew`
2. Test the bundle directly: `npx -y hebrew-token-saver demo`
   בדוק את החבילה ישירות: `npx -y hebrew-token-saver demo`
3. Restart Claude Code fully (quit and relaunch)
   הפעל מחדש את Claude Code לחלוטין (צא והפעל שוב)

**Translation API Quota Exceeded / גבול API לתרגום חורג**

The MyMemory API has a daily limit of 1000 words. Use the local model fallback:
ל-MyMemory API יש גבול יומי של 1000 מילים. השתמש במודל המקומי:

```bash
npm install @xenova/transformers
npx -y hebrew-token-saver demo-hybrid
```

---

### 🟩 OpenCode
### 🟩 OpenCode

#### Installation on macOS / התקנה ב-macOS

```bash
# Quick install (recommended) / התקנה מהירה (מומלץ)
npm run install-opencode

# Verify installation / אימות התקנה
ls -la ~/.opencode/skills/hebrew-auto-translate/

# Configure in settings.json (optional) / תצורה בקובץ settings.json (אופציונלי)
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

# Restart OpenCode / הפעל מחדש את OpenCode
```

#### Installation on Windows / התקנה ב-Windows

**Using PowerShell / באמצעות PowerShell:**

```powershell
# Quick install (recommended) / התקנה מהירה (מומלץ)
npm run install-opencode

# Verify installation / אימות התקנה
Get-ChildItem "$HOME\.opencode\skills\hebrew-auto-translate"

# Configure in settings.json (optional) / תצורה בקובץ settings.json (אופציונלי)
$settings = @{
    skills = @{
        "hebrew-auto-translate" = @{
            enabled = $true
            autoTranslate = $true
            responseLanguage = "hebrew"
            useRtlFormatting = $false
        }
    }
}
$settings | ConvertTo-Json | Out-File "$HOME\.opencode\settings.json" -Append

# Restart OpenCode / הפעל מחדש את OpenCode
```

**Using Command Prompt / באמצעות Command Prompt:**

```cmd
REM Quick install (recommended) / התקנה מהירה (מומלץ)
npm run install-opencode

REM Verify installation / אימות התקנה
dir %USERPROFILE%\.opencode\skills\hebrew-auto-translate\

REM Configure in settings.json (optional) / תצורה בקובץ settings.json (אופציונלי)
REM Manually add this to %USERPROFILE%\.opencode\settings.json:
REM {
REM   "skills": {
REM     "hebrew-auto-translate": {
REM       "enabled": true,
REM       "autoTranslate": true,
REM       "responseLanguage": "hebrew",
REM       "useRtlFormatting": false
REM     }
REM   }
REM }

REM Restart OpenCode / הפעל מחדש את OpenCode
```

#### Usage / שימוש

**Automatic Mode (Default) / מצב אוטומטי (ברירת מחדל):**

Just type in Hebrew / פשוט כתוב בעברית — the skill automatically handles everything: הסקיל מטפל בהכל אוטומטית:

```
> איך מכינים חלבה?

[Skill automatically: Detects Hebrew → Translates → Sends to LLM]
[הסקיל אוטומטית: מזדהה עברית → מתרגם → שולח ל-LLM]
[LLM responds in Hebrew / ה-LLM עונה בעברית]
```

**Manual Mode / מצב ידני:**

```bash
# Basic translation / תרגום בסיסי
> /hebrew-translate "שלום עולם"

# Request English response / בקשת תשובה באנגלית
> /hebrew-translate "שלום עולם" --english

# Request RTL formatting / בקשת פורמט RTL
> /hebrew-translate "שלום עולם" --rtl

# Force translation / אכיפת תרגום
> /hebrew-translate "mixed text שלום" --force
```

**Example Output / דוגמת פלט:**

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

### 🟦 Pi.dev
### 🟦 Pi.dev

#### Installation on macOS / התקנה ב-macOS

**Option 1: Global Installation (Recommended - available in all projects)**
**אפשרות 1: התקנה גלובלית (מומלץ - זמין בכל הפרויקטים)**

```bash
# 1. Clone or download the repository / הורדת המאגר
git clone https://github.com/sysmesh/hebrew-token-saver.git

# 2. Create agent skills directory if it doesn't exist
# יצירת ספריית סקילים גלובלית אם היא לא קיימת
mkdir -p ~/.pi/agent/skills

# 3. Copy the Pi.dev skill to your agent skills directory
# העתקת סקיל Pi.dev לספריית הסקילים הגלובלית
cp -r hebrew-token-saver/skills/pi-dev ~/.pi/agent/skills/hebrew-auto-translate

# 4. Verify installation / אימות ההתקנה
ls -la ~/.pi/agent/skills/hebrew-auto-translate/

# 5. Restart pi.dev (if running) / הפעלה מחדש של pi.dev (אם רץ)
# The skill will auto-load on next session / הסקיל יטען אוטומטית בסיבוב הבא
```

**Option 2: Project-Level Installation (only in current project)**
**אפשרות 2: התקנה ברמת הפרויקט (רק בפרויקט הנוכחי)**

```bash
# 1. From your project directory, create .pi/skills directory
# מספריית הפרויקט שלך, צור ספריית .pi/skills
mkdir -p .pi/skills

# 2. Copy the skill (assuming you cloned hebrew-token-saver nearby)
# העתק את הסקיל (בהנחה שאתה קלטת את hebrew-token-saver בסמוך)
cp -r hebrew-token-saver/skills/pi-dev .pi/skills/hebrew-auto-translate

# 3. Verify installation / אימות ההתקנה
ls -la .pi/skills/hebrew-auto-translate/
```

#### Installation on Windows / התקנה ב-Windows

**Using PowerShell (Global) / באמצעות PowerShell (גלובלי):**

```powershell
# 1. Clone or download the repository / הורדת המאגר
git clone https://github.com/sysmesh/hebrew-token-saver.git

# 2. Create agent skills directory if it doesn't exist
# יצירת ספריית סקילים גלובלית אם היא לא קיימת
New-Item -ItemType Directory -Force -Path "$HOME\.pi\agent\skills"

# 3. Copy the Pi.dev skill to your agent skills directory
# העתקת סקיל Pi.dev לספריית הסקילים הגלובלית
Copy-Item -Recurse "hebrew-token-saver\skills\pi-dev" -Destination "$HOME\.pi\agent\skills\hebrew-auto-translate"

# 4. Verify installation / אימות ההתקנה
Get-ChildItem "$HOME\.pi\agent\skills\hebrew-auto-translate"

# 5. Restart pi.dev (if running) / הפעלה מחדש של pi.dev (אם רץ)
# The skill will auto-load on next session / הסקיל יטען אוטומטית בסיבוב הבא
```

**Using Command Prompt (Global) / באמצעות Command Prompt (גלובלי):**

```cmd
REM 1. Clone or download the repository / הורדת המאגר
git clone https://github.com/sysmesh/hebrew-token-saver.git

REM 2. Create agent skills directory if it doesn't exist
REM יצירת ספריית סקילים גלובלית אם היא לא קיימת
mkdir %USERPROFILE%\.pi\agent\skills

REM 3. Copy the Pi.dev skill to your agent skills directory
REM העתקת סקיל Pi.dev לספריית הסקילים הגלובלית
xcopy /E /I /Y hebrew-token-saver\skills\pi-dev %USERPROFILE%\.pi\agent\skills\hebrew-auto-translate\

REM 4. Verify installation / אימות ההתקנה
dir %USERPROFILE%\.pi\agent\skills\hebrew-auto-translate\

REM 5. Restart pi.dev (if running) / הפעלה מחדש של pi.dev (אם רץ)
REM The skill will auto-load on next session / הסקיל יטען אוטומטית בסיבוב הבא
```

#### Usage / שימוש

**Automatic Mode (Default) / מצב אוטומטי (ברירת מחדל):**

Simply type in Hebrew / פשוט כתוב בעברית — the skill automatically handles everything: הסקיל מטפל בהכל אוטומטית:

```
> איך מכינים חלבה?

[Skill automatically: Detects Hebrew → Translates → Sends to LLM]
[הסקיל אוטומטית: מזדהה עברית → מתרגם → שולח ל-LLM]
[LLM responds in Hebrew / ה-LLM עונה בעברית]
```

**Manual Mode with Flags / מצב ידני עם דגלים:**

```bash
# Force English response (saves more tokens) / אכוף תשובה באנגלית (חוסך יותר טוקנים)
> /hebrew-translate --english "שלום עולם"

# Force RTL formatting / אכוף פורמט RTL
> /hebrew-translate --rtl "שלום עולם"

# Force translation even if not detected as Hebrew / אכוף תרגום גם אם לא זוהה כעברית
> /hebrew-translate --force "mixed text שלום"
```

**Configuration (Optional) / תצורה (אופציונלי):**

Add to `~/.pi/config.json` / הוסף ל-`~/.pi/config.json`:

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

## Features / תכונות

### Command-Line Flags / דגלי שורת פקודה

| Flag / דגל | Description / תיאור | Example / דוגמא |
|------|-------------|---------|
| `--english` | LLM replies in English instead of Hebrew / ה-LLM עונה באנגלית במקום עברית | `hebrew-translate "שלום" --english` |
| `--rtl` | Forces RTL formatting for Hebrew output / מאכוף פורמט RTL לפלט עברי | `hebrew-translate "שלום" --rtl` |
| `--force` | Forces translation even if not Hebrew / מאכוף תרגום גם אם לא עברית | `hebrew-translate "Hi" --force` |
| `--api-only` | Use only MyMemory API (no local fallback) / השתמש רק ב-MyMemory API | `hebrew-translate --api-only "שלום"` |
| `--local-only` | Use only local model (skip API) / השתמש רק במודל המקומי | `hebrew-translate --local-only "שלום"` |

### Flag Combinations / שילובי דגלים

```bash
# These are incompatible / אלו לא תואמים:
hebrew-translate "שלום עולם" --rtl --english
# Error: --rtl and --english options are incompatible. / שגיאה: --rtl ו- --english אינם תואמים.
```

---

### Hebrew Detection / זיהוי עברית

Automatically detects Hebrew text based on character percentage:
זיהוי אוטומטי של טקסט עברי על בסיס אחוז התווים:

```javascript
// Detection algorithm / אלגוריתם זיהוי
function isHebrew(text) {
  // Checks for Hebrew characters (Unicode U+0590-U+05FF)
  // בודק תווים עבריים (Unicode U+0590-U+05FF)
  // Returns true if ≥20% of characters are Hebrew
  // מחזיר true אם ≥20% מהתווים הם עבריים
}
```

### Translation Methods / שיטות תרגום

| Method / שיטה | Speed / מהירות | Limits / מגבלות | Setup / התקנה |
|--------|-------|--------|-------|
| **MyMemory API** | ~100ms | 1000 words/day / 1000 מילים/יום | None / ללא |
| **Local Model / מודל מקומי** | ~500ms | Unlimited / ללא מגבלות | 150MB download / 150MB הורדה |
| **Hybrid / היברידי** | ~100-500ms | Unlimited / ללא מגבלות | Optional / אופציונלי |

### Hybrid Mode (Recommended) / מצב היברידי (מומלץ)

```bash
# Install local model support / התקנת תמיכה במודל מקומי
npm install @xenova/transformers

# Run in hybrid mode (auto-fallback) / הרצה במצב היברידי (fallback אוטומטי)
node hebrew-translator-hybrid.js "שלום עולם"

# Falls back to local model when / חוזר למודל המקומי כאשר:
# - API is unavailable / API לא זמין
# - Daily limit is reached / הגעת למגבלה היומית
# - Text is too long (>1000 chars) / הטקסט ארוך מדי (>1000 תווים)
```

---

## API Reference

### Command-Line Interface / ממשק שורת פקודה

```bash
# Basic usage / שימוש בסיסי
hebrew-translate <prompt> [options]

# Examples / דוגמאות:
hebrew-translate "שלום עולם"
hebrew-translate "שלום עולם" --english
hebrew-translate "שלום עולם" --rtl
```

### Programmatic API / ממשא תכנותי

```javascript
const { processHebrewPrompt } = require('./hebrew-translator.js');

async function example() {
  const result = await processHebrewPrompt("שלום עולם", {
    replyInEnglish: false,  // Set to true for English response / הגדר ל-true לתשובה באנגלית
    forceRTL: false,        // Set to true for RTL formatting / הגדר ל-true לפורמט RTL
    forceTranslate: false   // Set to true to force translation / הגדר ל-true לאכיפת תרגום
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

  // Send result.finalPrompt to your LLM / שלח את result.finalPrompt ל-LLM שלך
}
```

---

## Technical Details / פרטים טכניים

### Unicode BIDI Markers (RTL) / תווים Unicode BIDI (RTL)

The `--rtl` option uses these Unicode characters: האופציה `--rtl` משתמשת בתווים אלו של Unicode:

| Name / שם | Code / קוד | Character / תו | Description / תיאור |
|------|------|-----------|-------------|
| RLO | U+202E | `‮` | Right-to-Left Override |
| PDF | U+202C | `‬` | Pop Directional Formatting |
| FSI-R | U+2067 | `‌` | First Strong Isolate - RTL |

### Translation Pipeline / צינור תרגום

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Hebrew    │→→→│   English   │→→→│   LLM       │
│   Input     │    │ Translation│    │ + Hebrew    │
│             │    │            │    │ Response    │
│   קלט       │    │  תרגום     │    │  תשובה      │
│             │    │            │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
     ↓                  ↓                  ↓
  "שלום עולם"    "Hello world"    "שלום! איך..."
```

### Files Structure (MCP Server) / מבנה קבצים (שרת MCP)

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

---

## Troubleshooting / פתרון בעיות

### Claude Code MCP Server Issues / שגיאות שרת MCP ב-Claude Code

**Error: "Bundled server not found at: dist/hebrew-translator-mcp.js"**

Run `npm run bundle` first. If esbuild is missing, ensure you ran `npm install`.

**MCP Server Not Loading in Claude Code / שרת MCP לא נטען ב-Claude Code**

1. Verify the file exists: `ls ~/.claude/tools/hebrew-translator-mcp.js`
2. Check settings.json has the entry: `cat ~/.claude/settings.json | grep hebrew`
3. Restart Claude Code fully (quit and relaunch)

**Translation API Quota Exceeded / גבול API לתרגום חורג**

The MyMemory API has a daily limit of 1000 words. Use the local model fallback:
ל-MyMemory API יש גבול יומי של 1000 מילים. השתמש במודל המקומי:

```bash
npm install @xenova/transformers
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

### API Errors / שגיאות API

```bash
# If MyMemory API is unavailable, use local fallback:
# אם MyMemory API לא זמין, השתמש ב-fallback מקומי:
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

### Detection Issues / בעיות זיהוי

```bash
# Force translation if detection fails:
# אכוף תרגום אם הזיהוי נכשל:
node hebrew-translator.js "mixed text שלום" --force
```

### RTL Display Issues / בעיות תצוגה RTL

```bash
# If RTL formatting doesn't display correctly:
# אם פורמט RTL לא מוצג נכון:
# Try without --rtl flag, or use a different terminal
# נסה ללא דגל --rtl, או השתמש בטרמינל אחר
node hebrew-translator.js "שלום עולם" --english
```

---

## License / רישיון

MIT License - Feel free to use and modify.
MIT License - חופשי לשימוש ושינוי.

---

## Credits / קרדיטים

- **Translation API / API לתרגום**: MyMemory Translation API
- **Local Model / מודל מקומי**: Helsinki-NLP/opus-mt-he-en via Transformers.js
- **Inspired by**: Hebrew RTL formatting techniques
