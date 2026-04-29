/**
 * Pi.dev Prompt Interceptor for Hebrew Auto-Translation
 * 
 * This file is loaded by pi.dev and intercepts user prompts
 * to automatically translate Hebrew to English before sending to LLM.
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
async function translateToEnglish(text) {
  return new Promise((resolve, reject) => {
    const encodedText = encodeURIComponent(text.trim());
    const url = `${TRANSLATE_API_URL}?q=${encodedText}&langpair=${TRANSLATE_FROM}|${TRANSLATE_TO}`;
    
    HTTPS.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.responseData?.translatedText) {
            resolve(parsed.responseData.translatedText);
          } else {
            resolve(text); // Fallback to original
          }
        } catch (e) {
          resolve(text);
        }
      });
    }).on('error', () => resolve(text));
  });
}

/**
 * Main prompt interceptor
 * Called by pi.dev before sending prompts to LLM
 */
async function interceptPrompt(prompt, options = {}) {
  const { 
    replyInEnglish = false, 
    forceRTL = false,
    forceTranslate = false 
  } = options;
  
  // Check if Hebrew
  if (!isHebrew(prompt) && !forceTranslate) {
    return { prompt, intercepted: false };
  }
  
  // Translate
  const translated = await translateToEnglish(prompt);
  
  // Build response instruction
  let instruction = replyInEnglish 
    ? 'Important! Reply in English only'
    : 'Important! Reply in Hebrew';
  
  if (forceRTL && !replyInEnglish) {
    instruction += ' Use RTL formatting with proper Unicode BIDI markers.';
  }
  
  // Return intercepted prompt
  return {
    prompt: `${translated}. ${instruction}`,
    intercepted: true,
    original: prompt,
    translated,
    responseLanguage: replyInEnglish ? 'English' : 'Hebrew'
  };
}

/**
 * Pi.dev skill definition
 */
const skill = {
  name: 'hebrew-auto-translate',
  version: '1.0.0',
  type: 'prompt-interceptor',
  intercept: interceptPrompt,
  isHebrew,
  translateToEnglish
};

// Export for pi.dev
module.exports = skill;

// Also export individual functions
module.exports.interceptPrompt = interceptPrompt;
module.exports.isHebrew = isHebrew;
module.exports.translateToEnglish = translateToEnglish;
