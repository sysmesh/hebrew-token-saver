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
 *
 * @module skills/claude-code/hebrew-translator-mcp
 */

const { isHebrew, translateHebrew, buildFinalPrompt } = require('../../../lib/common');

/**
 * Main tool function
 * Called by Claude Code when user invokes /tool hebrew_translator
 * @param {object} args - Tool arguments
 * @param {string} args.prompt - The Hebrew prompt to translate
 * @param {boolean} [args.reply_in_english=false] - Request English response
 * @param {boolean} [args.force_rtl=false] - Apply RTL formatting
 * @param {boolean} [args.force_translate=false] - Force translation even if not Hebrew
 * @returns {Promise<object>} Translation result with final prompt for LLM
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
  let translated;
  let translationError;
  try {
    const result = await translateHebrew(prompt);
    translated = result.translated;
  } catch (error) {
    // Log error for debugging
    console.error('Translation failed:', error.message);
    translationError = error.message;
    // Fall back to original text if translation fails
    translated = prompt;
  }

  const { finalPrompt } = buildFinalPrompt(translated, {
    replyInEnglish: reply_in_english,
    forceRTL: force_rtl
  });

  const response = {
    success: !translationError,
    is_hebrew: true,
    original: prompt,
    translated,
    final_prompt: finalPrompt,
    response_language: reply_in_english ? 'English' : 'Hebrew',
    token_savings_estimate: 'Up to 40% on input tokens',
    usage_note: 'Send final_prompt to the LLM to get a response in the requested language'
  };

  // Include error info if translation failed
  if (translationError) {
    response.translation_warning = `Translation failed: ${translationError}. Using original text.`;
  }

  return response;
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
