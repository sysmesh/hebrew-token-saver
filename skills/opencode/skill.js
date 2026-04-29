/**
 * OpenCode Skill for Hebrew Auto-Translation
 * 
 * This skill automatically detects Hebrew prompts, translates them to English,
 * and requests responses in Hebrew. This saves up to 50% on input tokens.
 * 
 * Installation:
 * 1. Copy this directory to ~/.opencode/skills/hebrew-auto-translate/
 * 2. Restart OpenCode
 * 
 * Usage:
 * - Automatic: Just type in Hebrew
 * - Manual: /hebrew-translate "שלום עולם" [--english] [--rtl]
 */

const HTTPS = require('https');

// Configuration
const TRANSLATE_API_URL = 'https://api.mymemory.net/api/transliterate';
const TRANSLATE_FROM = 'iw';
const TRANSLATE_TO = 'en';

/**
 * Detect if text is Hebrew
 */
function isHebrew(text, threshold = 0.2) {
  if (!text || typeof text !== 'string') return false;
  const hebrewChars = text.match(/[\u0590-\u05FF]/g);
  return hebrewChars && (hebrewChars.length / text.length) >= threshold;
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
 * Process a Hebrew prompt
 */
async function processHebrewPrompt(prompt, options = {}) {
  const {
    replyInEnglish = false,
    forceRTL = false,
    forceTranslate = false,
    threshold = 0.2
  } = options;
  
  // Validate options
  if (forceRTL && replyInEnglish) {
    return {
      success: false,
      error: 'Options --rtl and --english are incompatible'
    };
  }
  
  // Check if Hebrew
  const detectedHebrew = isHebrew(prompt, threshold) || forceTranslate;
  
  if (!detectedHebrew) {
    return {
      success: true,
      isHebrew: false,
      original: prompt,
      translated: null,
      finalPrompt: prompt,
      message: 'Text is not Hebrew, returning as-is'
    };
  }
  
  // Translate
  const translated = await translateHebrew(prompt);
  
  // Build response instruction
  let instruction = replyInEnglish
    ? 'Important! Reply in English only'
    : 'Important! Reply in Hebrew';
  
  if (forceRTL && !replyInEnglish) {
    instruction += ' Use RTL formatting with proper Unicode BIDI markers.';
  }
  
  const finalPrompt = `${translated}. ${instruction}`;
  
  return {
    success: true,
    isHebrew: true,
    original: prompt,
    translated: translated,
    finalPrompt: finalPrompt,
    responseLanguage: replyInEnglish ? 'English' : 'Hebrew',
    tokenSavings: 'Up to 40% on input tokens'
  };
}

/**
 * OpenCode Skill: onPrompt hook
 * Called automatically before every prompt is sent to the LLM
 */
async function onPrompt(prompt, context) {
  // Check if auto-translate is enabled
  if (!context.config?.autoTranslate) {
    return { prompt, intercepted: false };
  }
  
  // Process the prompt
  const result = await processHebrewPrompt(prompt, {
    replyInEnglish: context.config?.responseLanguage === 'english',
    forceRTL: context.config?.useRtlFormatting,
    threshold: context.config?.hebrewThreshold
  });
  
  return {
    prompt: result.finalPrompt,
    intercepted: result.isHebrew,
    metadata: result
  };
}

/**
 * OpenCode Command: /hebrew-translate
 * Manual translation command
 */
async function hebrewTranslate(args, context) {
  const prompt = args.prompt;
  
  if (!prompt) {
    return {
      success: false,
      error: 'Please provide a Hebrew prompt to translate'
    };
  }
  
  const result = await processHebrewPrompt(prompt, {
    replyInEnglish: args['--english'] || false,
    forceRTL: args['--rtl'] || false,
    forceTranslate: args['--force'] || false
  });
  
  if (!result.success) {
    return result;
  }
  
  // Display result
  let output = '\n=== Hebrew Translation ===\n';
  output += `Original: ${result.original}\n`;
  
  if (result.isHebrew) {
    output += `Translated: ${result.translated}\n`;
    output += `Response Language: ${result.responseLanguage}\n`;
    output += `Token Savings: ${result.tokenSavings}\n`;
  } else {
    output += `Status: Not detected as Hebrew\n`;
  }
  
  output += `\nFinal Prompt: ${result.finalPrompt}\n`;
  output += '=========================\n';
  
  return {
    success: true,
    output: output,
    data: result
  };
}

// Export for OpenCode
module.exports = {
  onPrompt,
  hebrewTranslate,
  isHebrew,
  translateHebrew,
  processHebrewPrompt
};

// Skill metadata
module.exports.skillMetadata = {
  name: 'hebrew-auto-translate',
  version: '1.0.0',
  platform: 'opencode'
};
