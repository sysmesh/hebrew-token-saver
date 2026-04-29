/**
 * Claude Code MCP Tool for Hebrew Translation
 * 
 * This tool can be called from Claude Code to translate Hebrew prompts
 * to English and request responses in Hebrew or English.
 * 
 * Installation:
 * 1. Place this file in ~/.claude/tools/
 * 2. Restart Claude Code
 * 
 * Usage in Claude Code:
 * /tool hebrew_translator --prompt "שלום עולם"
 * /tool hebrew_translator --prompt "שלום עולם" --reply-in-english
 */

const HTTPS = require('https');

// Configuration
const TRANSLATE_API_URL = 'https://api.mymemory.net/api/transliterate';
const TRANSLATE_FROM = 'iw';
const TRANSLATE_TO = 'en';

/**
 * Detect if text is Hebrew
 */
function isHebrew(text) {
  if (!text || typeof text !== 'string') return false;
  const hebrewChars = text.match(/[\u0590-\u05FF]/g);
  return hebrewChars && (hebrewChars.length / text.length) >= 0.2;
}

/**
 * Translate Hebrew to English via MyMemory API
 */
async function translateHebrew(text) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(text.trim());
    const url = `${TRANSLATE_API_URL}?q=${encoded}&langpair=${TRANSLATE_FROM}|${TRANSLATE_TO}`;
    
    HTTPS.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.responseData?.translatedText || text);
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

/**
 * Main tool function
 * Called by Claude Code when user invokes /tool hebrew_translator
 */
async function hebrew_translator(args) {
  const {
    prompt,
    reply_in_english = false,
    force_rtl = false,
    force_translate = false
  } = args;
  
  // Validate options
  if (force_rtl && reply_in_english) {
    return {
      success: false,
      error: 'Options --rtl and --english are incompatible. RTL formatting only makes sense for Hebrew output.'
    };
  }
  
  // Check if Hebrew
  const detectedHebrew = isHebrew(prompt) || force_translate;
  
  if (!detectedHebrew) {
    return {
      success: true,
      is_hebrew: false,
      original: prompt,
      translated: null,
      final_prompt: prompt,
      message: 'Text is not Hebrew, returning as-is'
    };
  }
  
  // Translate
  const translated = await translateHebrew(prompt);
  
  // Build response instruction
  let instruction = reply_in_english
    ? 'Important! Reply in English only'
    : 'Important! Reply in Hebrew';
  
  if (force_rtl && !reply_in_english) {
    instruction += ' Use RTL formatting with proper Unicode BIDI markers.';
  }
  
  const finalPrompt = `${translated}. ${instruction}`;
  
  return {
    success: true,
    is_hebrew: true,
    original: prompt,
    translated: translated,
    final_prompt: finalPrompt,
    response_language: reply_in_english ? 'English' : 'Hebrew',
    token_savings_estimate: 'Up to 40% on input tokens',
    usage_note: 'Send final_prompt to the LLM to get a response in the requested language'
  };
}

// Export for Claude Code
module.exports = { hebrew_translator };

// Tool metadata
module.exports.toolMetadata = {
  name: 'hebrew_translator',
  version: '1.0.0',
  description: 'Translates Hebrew prompts to English and requests responses in Hebrew or English',
  author: 'Hebrew Token Saver',
  platform: 'claude-code'
};
