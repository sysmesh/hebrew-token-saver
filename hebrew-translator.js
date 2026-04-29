#!/usr/bin/env node

/**
 * Hebrew Auto-Translate Skill
 * 
 * Cross-platform skill for pi.dev, ClaudeCode, and opencode
 * that translates Hebrew prompts to English and requests Hebrew responses.
 * 
 * Uses the free MyMemory Translation API (no API key required)
 * https://www.mymemory.net/api/
 */

const HTTP = require('http');
const HTTPS = require('https');

// Configuration
const TRANSLATE_API_URL = 'https://api.mymemory.net/api/transliterate';
const TRANSLATE_FROM = 'iw'; // Hebrew (Israeli)
const TRANSLATE_TO = 'en';   // English

/**
 * Detect if text is likely Hebrew
 * Checks for Hebrew characters (Unicode range U+0590-U+05FF)
 */
function isHebrew(text) {
  if (!text || typeof text !== 'string') return false;
  
  // Hebrew character range: \u0590-\u05FF
  const HEBREW_REGEX = /[\u0590-\u05FF]/g;
  
  // Filter to only Hebrew characters
  const hebrewChars = text.match(HEBREW_REGEX);
  
  if (!hebrewChars || hebrewChars.length === 0) return false;
  
  // Calculate percentage of Hebrew characters
  const hebrewPercentage = hebrewChars.length / text.length;
  
  // Consider it Hebrew if at least 20% of characters are Hebrew
  // This allows for mixed content (Hebrew + punctuation, numbers, etc.)
  return hebrewPercentage >= 0.2;
}

/**
 * Make HTTP/HTTPS request
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? HTTPS : HTTP;
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Translate text from Hebrew to English using MyMemory API
 */
async function translateHebrewToEnglish(text) {
  // URL encode the text
  const encodedText = encodeURIComponent(text.trim());
  const url = `${TRANSLATE_API_URL}?q=${encodedText}&langpair=${TRANSLATE_FROM}|${TRANSLATE_TO}`;
  
  try {
    const response = await httpGet(url);
    
    // MyMemory API response format:
    // {
    //   "responseData": {
    //     "translatedText": "...",
    //     ...other metadata...
    //   },
    //   "match": [...],
    //   "ms": 0
    // }
    
    if (response.responseData && response.responseData.translatedText) {
      return {
        success: true,
        translated: response.responseData.translatedText,
        original: text
      };
    } else if (response.responseStatus) {
      // API error
      throw new Error(`Translation API error: ${response.responseStatus}`);
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      original: text
    };
  }
}

/**
 * Unicode BIDI control characters for RTL formatting
 */
const RTL_OVERRIDE = '\u202E'; // RIGHT-TO-LEFT OVERRIDE (RLO)
const RTL_POP = '\u202C';      // POP DIRECTIONAL FORMATTING (PDF)
const RTL_ISOLATE = '\u2067';  // FIRST STRONG ISOLATE - RTL

/**
 * Apply RTL formatting to Hebrew text
 * Wraps text with Unicode BIDI control characters
 */
function applyRTLFormatting(text) {
  if (!text || typeof text !== 'string') return text;
  
  // Use RLO + PDF to force RTL display
  // This ensures Hebrew text displays right-to-left in all contexts
  return `${RTL_OVERRIDE}${text}${RTL_POP}`;
}

/**
 * Process a Hebrew prompt:
 * 1. Detect if Hebrew
 * 2. Translate to English
 * 3. Append response language request (Hebrew or English)
 */
async function processHebrewPrompt(prompt, options = {}) {
  const { forceTranslate = false, replyInEnglish = false, forceRTL = false } = options;
  
  const result = {
    original: prompt,
    isHebrew: false,
    translated: null,
    finalPrompt: prompt,
    responseLanguage: replyInEnglish ? 'English' : 'Hebrew',
    rtlFormatted: false,
    error: null
  };
  
  // Check if prompt is Hebrew
  result.isHebrew = isHebrew(prompt) || forceTranslate;
  
  if (!result.isHebrew) {
    return result;
  }
  
  // Translate to English
  const translation = await translateHebrewToEnglish(prompt);
  
  // Determine response language instruction
  let responseInstruction = replyInEnglish 
    ? 'Important! Reply in English only'
    : 'Important! Reply in Hebrew';
  
  // Add RTL formatting instruction if requested (only for Hebrew responses)
  if (forceRTL && !replyInEnglish) {
    responseInstruction += ' Use RTL formatting with proper Unicode BIDI markers.';
  }
  
  if (translation.success) {
    result.translated = translation.translated;
    
    // Append the response language request
    result.finalPrompt = `${translation.translated}. ${responseInstruction}`;
  } else {
    result.error = translation.error;
    
    // Fall back to original with response language request
    result.finalPrompt = `${prompt}. ${responseInstruction}`;
  }
  
  // Apply RTL formatting to the final prompt if requested
  if (forceRTL && !replyInEnglish) {
    result.finalPrompt = applyRTLFormatting(result.finalPrompt);
    result.rtlFormatted = true;
  }
  
  return result;
}

/**
 * Main function - CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Hebrew Auto-Translate Skill');
    console.log('===========================');
    console.log('');
    console.log('Usage: node hebrew-translator.js <hebrew-text> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --english    Force LLM to reply in English (not Hebrew)');
    console.log('  --rtl        Force RTL formatting for Hebrew output (incompatible with --english)');
    console.log('  --force      Force translation even if text is not Hebrew');
    console.log('');
    console.log('Examples:');
    console.log('  node hebrew-translator.js "שלום עולם"');
    console.log('  node hebrew-translator.js "שלום עולם" --english');
    console.log('  node hebrew-translator.js "שלום עולם" --rtl');
    console.log('');
    console.log('This skill:');
    console.log('1. Detects Hebrew text');
    console.log('2. Translates to English via MyMemory API');
    console.log('3. Appends ". Important! Reply in Hebrew" (or English if --english)');
    console.log('4. Returns the final prompt to send to LLM');
    process.exit(0);
  }
  
  // Parse options
  const options = {
    replyInEnglish: args.includes('--english'),
    forceRTL: args.includes('--rtl'),
    forceTranslate: args.includes('--force')
  };
  
  // Validate: --rtl and --english are incompatible
  if (options.forceRTL && options.replyInEnglish) {
    console.error('Error: --rtl and --english options are incompatible.');
    console.error('RTL formatting only makes sense for Hebrew output.');
    process.exit(1);
  }
  
  // Remove options from args
  const promptArgs = args.filter(a => !a.startsWith('--'));
  
  // Join all args as the prompt (handles spaces)
  const prompt = promptArgs.join(' ');
  
  console.log('Original prompt:');
  console.log(prompt);
  console.log('');
  
  const result = await processHebrewPrompt(prompt, options);
  
  console.log('Detection result:');
  console.log(`  Is Hebrew: ${result.isHebrew ? 'Yes ✓' : 'No'}`);
  console.log('');
  
  if (result.isHebrew) {
    if (result.translated) {
      console.log('Translation:');
      console.log(`  ${result.translated}`);
      console.log('');
    }
    
    if (result.error) {
      console.log('Error:');
      console.log(`  ${result.error}`);
      console.log('  (Using original Hebrew prompt)');
      console.log('');
    }
  }
  
  console.log('Final prompt (send to LLM):');
  console.log(result.finalPrompt);
  console.log('');
  
  // Also output as JSON for programmatic use
  console.log('JSON output:');
  console.log(JSON.stringify(result, null, 2));
}

// Export for use as module
module.exports = {
  isHebrew,
  translateHebrewToEnglish,
  processHebrewPrompt
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
