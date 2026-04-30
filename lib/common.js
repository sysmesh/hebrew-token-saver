/**
 * Shared utilities for Hebrew Auto-Translate Skill
 */

const HTTPS = require('https');

// Configuration - use /api/translate, not /api/transliterate
const TRANSLATE_API_URL = 'https://api.mymemory.net/api/translate';
const TRANSLATE_FROM = 'iw';
const TRANSLATE_TO = 'en';

// Unicode BIDI control characters for RTL formatting
const RTL_OVERRIDE = '‮'; // RIGHT-TO-LEFT OVERRIDE (RLO)
const RTL_POP = '‬';      // POP DIRECTIONAL FORMATTING (PDF)
const RTL_ISOLATE = '⁧';  // FIRST STRONG ISOLATE - RTL

/**
 * Detect if text is Hebrew (≥20% Hebrew characters by default)
 */
function isHebrew(text, threshold = 0.2) {
  if (!text || typeof text !== 'string') return false;

  const hebrewChars = text.match(/[֐-׿]/g);

  if (!hebrewChars || hebrewChars.length === 0) return false;

  return hebrewChars.length / text.length >= threshold;
}

/**
 * Make an HTTPS GET request and parse JSON response
 */
function httpGet(url) {
  return new Promise((resolve, reject) => {
    HTTPS.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    }).on('error', reject);
  });
}

/**
 * Translate Hebrew to English via MyMemory API
 */
async function translateHebrew(text) {
  const encoded = encodeURIComponent(text.trim());
  const url = `${TRANSLATE_API_URL}?q=${encoded}&langpair=${TRANSLATE_FROM}|${TRANSLATE_TO}`;

  const response = await httpGet(url);

  if (response.responseData && response.responseData.translatedText) {
    return {
      success: true,
      translated: response.responseData.translatedText,
      original: text
    };
  } else if (response.responseStatus) {
    throw new Error(`Translation API error: ${response.responseStatus}`);
  } else {
    throw new Error('Unexpected API response format');
  }
}

/**
 * Apply RTL formatting to Hebrew text using Unicode BIDI markers
 */
function applyRTLFormatting(text) {
  if (!text || typeof text !== 'string') return text;

  return `${RTL_OVERRIDE}${text}${RTL_POP}`;
}

/**
 * Build the final prompt from a translated text and options
 */
function buildFinalPrompt(translated, options = {}) {
  const { replyInEnglish = false, forceRTL = false } = options;

  let instruction = replyInEnglish
    ? 'Important! Reply in English only'
    : 'Important! Reply in Hebrew';

  if (forceRTL && !replyInEnglish) {
    instruction += ' Use RTL formatting with proper Unicode BIDI markers.';
  }

  let finalPrompt = `${translated}. ${instruction}`;

  if (forceRTL && !replyInEnglish) {
    finalPrompt = applyRTLFormatting(finalPrompt);
  }

  return {
    finalPrompt,
    instruction,
    rtlFormatted: forceRTL && !replyInEnglish
  };
}

/**
 * Process a Hebrew prompt: detect, translate, build final prompt
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

  result.isHebrew = isHebrew(prompt) || forceTranslate;

  if (!result.isHebrew) {
    return result;
  }

  // Translate to English
  let translation;
  try {
    translation = await translateHebrew(prompt);
  } catch (error) {
    result.error = error.message;
    // Fall back to original with response language request
    // RTL formatting is applied to Hebrew text
    const { finalPrompt, rtlFormatted } = buildFinalPrompt(prompt, options);
    result.finalPrompt = finalPrompt;
    result.rtlFormatted = rtlFormatted;
    return result;
  }

  const { finalPrompt, rtlFormatted } = buildFinalPrompt(translation.translated, options);

  result.translated = translation.translated;
  result.finalPrompt = finalPrompt;
  result.rtlFormatted = rtlFormatted;

  return result;
}

module.exports = {
  isHebrew,
  httpGet,
  translateHebrew,
  applyRTLFormatting,
  buildFinalPrompt,
  processHebrewPrompt,
  RTL_OVERRIDE,
  RTL_POP,
  RTL_ISOLATE,
  TRANSLATE_API_URL,
  TRANSLATE_FROM,
  TRANSLATE_TO
};
