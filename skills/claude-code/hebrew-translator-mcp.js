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

const { isHebrew, translateHebrew, buildFinalPrompt } = require('../../../lib/common');

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
  let translated;
  try {
    const result = await translateHebrew(prompt);
    translated = result.translated;
  } catch (error) {
    // Fall back to original text if translation fails
    translated = prompt;
  }

  const { finalPrompt, rtlFormatted } = buildFinalPrompt(translated, {
    replyInEnglish: reply_in_english,
    forceRTL: force_rtl
  });

  return {
    success: true,
    is_hebrew: true,
    original: prompt,
    translated,
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
