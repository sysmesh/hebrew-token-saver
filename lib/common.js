/**
 * Shared utilities for Hebrew Auto-Translate Skill
 * @module lib/common
 * @description Provides core functionality for Hebrew detection, translation,
 * RTL formatting, and quota management.
 */

const HTTPS = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration - use /api/translate, not /api/transliterate
const TRANSLATE_API_URL = process.env.HEBREW_TRANSLATE_API || 'https://api.mymemory.net/api/translate';
const TRANSLATE_FROM = 'iw';
const TRANSLATE_TO = 'en';

// Maximum text length for API calls (URL length limit)
const MAX_TEXT_LENGTH = 800;

// Unicode BIDI control characters for RTL formatting
// These control the display direction of text in terminals and text editors
const RTL_OVERRIDE = '‮'; // U+202E - RIGHT-TO-LEFT OVERRIDE: Forces following text to be displayed RTL
const RTL_POP = '‬';      // U+202C - POP DIRECTIONAL FORMATTING: Ends the RTL override
const RTL_ISOLATE = '⁧';  // U+2067 - FIRST STRONG ISOLATE: Isolates RTL text from LTR context

// Quota tracking
const USAGE_FILE = path.join(os.homedir(), '.hebrew-translator-usage.json');
const DAILY_QUOTA_WORDS = 5000;

/**
 * Validate that a path is within the user's home directory
 * Prevents path traversal attacks
 * @param {string} filePath - The file path to validate
 * @returns {boolean} True if the path is safe (within home directory)
 */
function isSafePath(filePath) {
  const resolved = path.resolve(filePath);
  const homeDir = path.resolve(os.homedir());
  // Normalize separators for cross-platform comparison
  // Use '/' consistently to handle both Windows and Unix paths
  const normalizedResolved = resolved.replace(/\\/g, '/');
  const normalizedHome = homeDir.replace(/\\/g, '/');
  return normalizedResolved.startsWith(normalizedHome + '/');
}

/**
 * Detect if text is Hebrew (≥20% Hebrew characters by default)
 * @param {string} text - The text to analyze
 * @param {number} [threshold=0.2] - Minimum percentage of Hebrew characters (0.0-1.0)
 * @returns {boolean} True if text is detected as Hebrew
 */
function isHebrew(text, threshold = 0.2) {
  if (!text || typeof text !== 'string') return false;

  const hebrewChars = text.match(/[֐-׿]/g);

  if (!hebrewChars || hebrewChars.length === 0) return false;

  return hebrewChars.length / text.length >= threshold;
}

/**
 * Rate limiter for API calls (1 call per second to avoid rate limits)
 * @returns {Promise<void>} Resolves when delay is complete
 */
let lastApiCall = 0;
const API_CALL_DELAY = 1000; // 1 second between calls

async function rateLimitApiCall() {
  const now = Date.now();
  const timeSinceLastCall = now - lastApiCall;
  if (timeSinceLastCall < API_CALL_DELAY) {
    await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY - timeSinceLastCall));
  }
  lastApiCall = Date.now();
}

/**
 * Make an HTTPS GET request and parse JSON response
 * @param {string} url - The URL to fetch
 * @returns {Promise<object>} Parsed JSON response or raw data
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
 * @param {string} text - The Hebrew text to translate
 * @returns {Promise<object>} Translation result with translated text
 * @throws {Error} If input is invalid, text too long, or API fails
 */
async function translateHebrew(text) {
  if (typeof text !== 'string') {
    throw new Error('Input must be a string');
  }

  const trimmed = text.trim();
  if (trimmed.length === 0) {
    throw new Error('Input cannot be empty');
  }

  if (trimmed.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text too long: ${trimmed.length} chars (max ${MAX_TEXT_LENGTH}). Please split into smaller chunks.`);
  }

  const encoded = encodeURIComponent(trimmed);
  const url = `${TRANSLATE_API_URL}?q=${encoded}&langpair=${TRANSLATE_FROM}|${TRANSLATE_TO}`;

  // Rate limit API calls to avoid hitting rate limits
  await rateLimitApiCall();
  const response = await httpGet(url);

  // Check for quota exceeded or rate limit errors
  if (response.responseDetails && (
    response.responseDetails.includes('limit') ||
    response.responseDetails.includes('quota') ||
    response.responseDetails.includes('rate limit')
  )) {
    throw new Error(`API quota exceeded: ${response.responseDetails}`);
  }

  // Check for translated text
  if (response.responseData && response.responseData.translatedText) {
    // Track quota usage (approximate word count)
    const wordCount = trimmed.split(/\s+/).length;
    trackTranslation(wordCount);

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
 * Only applies to text that contains Hebrew characters
 *
 * RTL formatting wraps Hebrew content with BIDI control characters:
 * - RLO (U+202E): Forces RTL display of the wrapped text
 * - PDF (U+202C): Ends the RTL override
 *
 * Note: When RTL is applied, only the Hebrew content is wrapped.
 * The English instruction remains LTR and appears after the RTL-wrapped content.
 * This is intentional for display in mixed-language contexts.
 * @param {string} text - The text to format
 * @returns {string} RTL-formatted text, or original if no Hebrew characters
 */
function applyRTLFormatting(text) {
  if (!text || typeof text !== 'string') return text;

  // Only apply RTL if text contains Hebrew characters
  if (!/[֐-׿]/.test(text)) return text;

  return `${RTL_OVERRIDE}${text}${RTL_POP}`;
}

/**
 * Build the final prompt from a translated text and options
 * @param {string} translated - The translated English text
 * @param {object} [options={}] - Configuration options
 * @param {boolean} [options.replyInEnglish=false] - Request English response
 * @param {boolean} [options.forceRTL=false] - Apply RTL formatting
 * @returns {object} Final prompt with instruction and formatting info
 */
function buildFinalPrompt(translated, options = {}) {
  const { replyInEnglish = false, forceRTL = false } = options;

  // RTL formatting only makes sense for Hebrew output
  const shouldApplyRTL = forceRTL && !replyInEnglish;

  let instruction = replyInEnglish
    ? 'Important! Reply in English only'
    : 'Important! Reply in Hebrew';

  if (shouldApplyRTL) {
    instruction += ' Use RTL formatting with proper Unicode BIDI markers.';
  }

  let finalPrompt = `${translated}. ${instruction}`;

  if (shouldApplyRTL) {
    // Only apply RTL markers if the translated text contains Hebrew characters
    // Note: RTL formatting wraps only the Hebrew content, not the English instruction
    // This is intentional for display in mixed-language contexts
    if (/[֐-׿]/.test(translated)) {
      finalPrompt = `${applyRTLFormatting(translated)}. ${instruction}`;
    }
  }

  return {
    finalPrompt,
    instruction,
    rtlFormatted: shouldApplyRTL && /[֐-׿]/.test(translated)
  };
}

/**
 * Process a Hebrew prompt: detect, translate, build final prompt
 * @param {string} prompt - The original prompt text
 * @param {object} [options={}] - Configuration options
 * @param {boolean} [options.forceTranslate=false] - Force translation even if not detected
 * @param {boolean} [options.replyInEnglish=false] - Request English response
 * @param {boolean} [options.forceRTL=false] - Apply RTL formatting
 * @param {number} [options.threshold=0.2] - Hebrew detection threshold
 * @returns {Promise<object>} Processing result with translation and final prompt
 */
async function processHebrewPrompt(prompt, options = {}) {
  const { forceTranslate = false, replyInEnglish = false, forceRTL = false, threshold = 0.2 } = options;

  const result = {
    success: true,
    original: prompt,
    isHebrew: false,
    translated: null,
    finalPrompt: prompt,
    responseLanguage: replyInEnglish ? 'English' : 'Hebrew',
    rtlFormatted: false,
    error: null
  };

  result.isHebrew = isHebrew(prompt, threshold) || forceTranslate;

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

/**
 * Get quota usage data from file
 * @returns {object} Usage data with dailyWords and lastReset timestamp
 */
function getUsageData() {
  // Validate path to prevent path traversal
  if (!isSafePath(USAGE_FILE)) {
    console.error('Invalid usage file path, using fallback');
    return { dailyWords: 0, lastReset: Date.now() };
  }

  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
      return data;
    }
  } catch (error) {
    console.error('Failed to read usage file:', error.message);
  }
  return { dailyWords: 0, lastReset: Date.now() };
}

/**
 * Save quota usage data to file
 * @param {object} data - Usage data to save
 */
function saveUsageData(data) {
  // Validate path to prevent path traversal
  if (!isSafePath(USAGE_FILE)) {
    console.error('Invalid usage file path, cannot save');
    return;
  }

  try {
    fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Failed to save usage file:', error.message);
  }
}

/**
 * Check if quota needs reset (daily reset at midnight)
 * @param {object} usage - Current usage data
 * @returns {boolean} True if quota should be reset
 */
function shouldResetQuota(usage) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  return (now - usage.lastReset) > oneDay;
}

/**
 * Track translation words and update quota
 * @param {number} wordCount - Number of words in the translated text
 * @returns {object} Quota information including words used and remaining
 */
function trackTranslation(wordCount) {
  const usage = getUsageData();

  // Reset daily if needed
  if (shouldResetQuota(usage)) {
    usage.dailyWords = 0;
    usage.lastReset = Date.now();
  }

  usage.dailyWords += wordCount;
  saveUsageData(usage);

  return {
    wordsUsed: usage.dailyWords,
    wordsRemaining: Math.max(0, DAILY_QUOTA_WORDS - usage.dailyWords),
    quotaExceeded: usage.dailyWords >= DAILY_QUOTA_WORDS
  };
}

/**
 * Get remaining quota without modifying usage data
 * @returns {object} Quota information including words used and remaining
 */
function getRemainingQuota() {
  const usage = getUsageData();

  // Reset daily if needed
  if (shouldResetQuota(usage)) {
    usage.dailyWords = 0;
    usage.lastReset = Date.now();
    saveUsageData(usage);
  }

  return {
    wordsUsed: usage.dailyWords,
    wordsRemaining: Math.max(0, DAILY_QUOTA_WORDS - usage.dailyWords),
    quotaExceeded: usage.dailyWords >= DAILY_QUOTA_WORDS
  };
}

module.exports = {
  isHebrew,
  httpGet,
  translateHebrew,
  applyRTLFormatting,
  buildFinalPrompt,
  processHebrewPrompt,
  MAX_TEXT_LENGTH,
  RTL_OVERRIDE,
  RTL_POP,
  RTL_ISOLATE,
  TRANSLATE_API_URL,
  TRANSLATE_FROM,
  TRANSLATE_TO,
  USAGE_FILE,
  DAILY_QUOTA_WORDS,
  trackTranslation,
  getRemainingQuota
};
