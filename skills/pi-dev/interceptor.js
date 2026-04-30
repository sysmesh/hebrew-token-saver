/**
 * Pi.dev Prompt Interceptor for Hebrew Auto-Translation
 *
 * This file is loaded by pi.dev and intercepts user prompts
 * to automatically translate Hebrew to English before sending to LLM.
 *
 * @module skills/pi-dev/interceptor
 */

const { isHebrew, translateHebrew, buildFinalPrompt } = require('../../../lib/common');

/**
 * Main prompt interceptor
 * Called by pi.dev before sending prompts to LLM
 * @param {string} prompt - The user's prompt text
 * @param {object} [options={}] - Interception options
 * @param {boolean} [options.replyInEnglish=false] - Request English response
 * @param {boolean} [options.forceRTL=false] - Apply RTL formatting
 * @param {boolean} [options.forceTranslate=false] - Force translation even if not Hebrew
 * @returns {Promise<object>} Interception result with modified prompt
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
  let translated;
  try {
    const result = await translateHebrew(prompt);
    translated = result.translated;
  } catch (error) {
    // Fall back to original text if translation fails
    translated = prompt;
  }

  const { finalPrompt, rtlFormatted } = buildFinalPrompt(translated, options);

  // Return intercepted prompt
  return {
    prompt: finalPrompt,
    intercepted: true,
    original: prompt,
    translated,
    responseLanguage: replyInEnglish ? 'English' : 'Hebrew',
    rtlFormatted
  };
}

/**
 * Pi.dev skill definition
 * @type {object}
 * @property {string} name - Skill name
 * @property {string} version - Skill version
 * @property {string} type - Skill type (prompt-interceptor)
 * @property {function} intercept - Prompt interception function
 * @property {function} isHebrew - Hebrew detection function
 */
const skill = {
  name: 'hebrew-auto-translate',
  version: '1.0.0',
  type: 'prompt-interceptor',
  intercept: interceptPrompt,
  isHebrew
};

// Export for pi.dev
module.exports = skill;

// Also export individual functions
module.exports.interceptPrompt = interceptPrompt;
module.exports.isHebrew = isHebrew;
