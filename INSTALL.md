# Installation Guide - Hebrew Token Saver

## Quick Installation by Platform

### Pi.dev Installation

```bash
# 1. Clone or download the repository
git clone https://github.com/sysmesh/hebrew-token-saver.git

# 2. Copy the Pi.dev skill to your skills directory
cp -r skills/pi-dev ~/.pi/skills/hebrew-auto-translate

# 3. Verify installation
ls -la ~/.pi/skills/hebrew-auto-translate/

# 4. Restart pi.dev (if running)
# The skill will auto-load on next session
```

**Usage in Pi.dev:**
```bash
# Automatic mode - just type in Hebrew
> איך מכינים חלבה?

# Manual mode with flags
> /hebrew-translate --english "שלום עולם"
> /hebrew-translate --rtl "שלום עולם"
```

---

### Claude Code Installation

```bash
# 1. Create tools directory if it doesn't exist
mkdir -p ~/.claude/tools

# 2. Copy the tool files
cp skills/claude-code/hebrew-translator-mcp.js ~/.claude/tools/
cp skills/claude-code/hebrew-translator.tool.json ~/.claude/tools/

# 3. Verify installation
ls -la ~/.claude/tools/hebrew-translator*

# 4. Restart Claude Code
```

**Usage in Claude Code:**
```bash
# Use the tool directly
/tool hebrew_translator --prompt "שלום עולם"

# Request English response
/tool hebrew_translator --prompt "שלום עולם" --reply-in-english

# Request RTL formatting
/tool hebrew_translator --prompt "שלום עולם" --force-rtl
```

---

### OpenCode Installation

```bash
# 1. Copy the skill directory
cp -r skills/opencode ~/.opencode/skills/hebrew-auto-translate

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

**Usage in OpenCode:**
```bash
# Automatic mode - just type in Hebrew
> איך מכינים חלבה?

# Manual mode
> /hebrew-translate "שלום עולם"
> /hebrew-translate "שלום עולם" --english
> /hebrew-translate "שלום עולם" --rtl
```

---

## Verification

### Test Hebrew Detection

```bash
# Run the test suite
cd /path/to/hebrew-token-saver
node test.js

# Expected output:
# Testing Hebrew Detection
# ========================
# 
# Test 1: Pure Hebrew
#   Input: "שלום עולם"
#   Expected: true, Got: true - ✓ PASS
# ...
# Results: 9 passed, 0 failed
```

### Test Translation

```bash
# Test basic translation
node hebrew-translator.js "שלום עולם"

# Expected output:
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

### Test --english Flag

```bash
node hebrew-translator.js "שלום עולם" --english

# Final prompt should end with:
# Hello world . Important! Reply in English only
```

### Test --rtl Flag

```bash
node hebrew-translator.js "שלום עולם" --rtl

# Final prompt should be wrapped with RTL markers
# and include RTL formatting instruction
```

---

## Troubleshooting

### Skill Not Loading

**Pi.dev:**
```bash
# Check if skill is in correct location
ls -la ~/.pi/skills/hebrew-auto-translate/

# Check pi.dev logs for errors
~/.pi/logs/*.log
```

**Claude Code:**
```bash
# Verify tool files exist
ls -la ~/.claude/tools/hebrew-translator*

# Check Claude Code configuration
cat ~/.claude/config.json
```

**OpenCode:**
```bash
# Verify skill files exist
ls -la ~/.opencode/skills/hebrew-auto-translate/

# Check OpenCode logs
~/.opencode/logs/*.log
```

### Translation Not Working

```bash
# Test API connectivity
curl "https://api.mymemory.net/api/transliterate?q=%D7%A9%D7%9C%D7%95%D7%9D&langpair=iw|en"

# If API is down, use local mode (requires installation)
npm install @xenova/transformers
node hebrew-translator-hybrid.js --local-only "שלום עולם"
```

### Hebrew Not Detected

```bash
# Force translation
/hebrew-translate --force "mixed text שלום"

# Check detection threshold in configuration
# Default is 20% Hebrew characters
```

---

## Uninstallation

### Pi.dev
```bash
rm -rf ~/.pi/skills/hebrew-auto-translate
```

### Claude Code
```bash
rm ~/.claude/tools/hebrew-translator-mcp.js
rm ~/.claude/tools/hebrew-translator.tool.json
```

### OpenCode
```bash
rm -rf ~/.opencode/skills/hebrew-auto-translate
```

---

## Files Structure

```
hebrew-token-saver/
├── INSTALL.md                      # This file
├── README_FULL.md                  # Full documentation
├── hebrew-translator.js            # Standalone translator
├── hebrew-translator-hybrid.js     # Hybrid translator
├── test.js                         # Test suite
└── skills/
    ├── pi-dev/
    │   ├── SKILL.md
    │   ├── interceptor.js
    │   └── package.json
    ├── claude-code/
    │   ├── hebrew-translator.tool.json
    │   └── hebrew-translator-mcp.js
    └── opencode/
        ├── SKILL.json
        └── skill.js
```

---

## Support

- **Issues**: https://github.com/sysmesh/hebrew-token-saver/issues
- **Documentation**: See README_FULL.md
- **API**: MyMemory Translation API (https://www.mymemory.net/api/)
