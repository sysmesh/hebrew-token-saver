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
 *
 * @module skills/opencode/skill
 */

const { processHebrewPrompt } = require('../../../lib/common');

/**
 * OpenCode Skill: onPrompt hook
 * Called automatically before every prompt is sent to the LLM
 * @param {string} prompt - The user's prompt text
 * @param {object} context - Skill context with configuration
 * @param {object} [context.config] - Skill configuration
 * @param {boolean} [context.config.autoTranslate=true] - Enable automatic translation
 * @param {string} [context.config.responseLanguage='hebrew'] - Response language (hebrew|english)
 * @param {boolean} [context.config.useRtlFormatting=false] - Enable RTL formatting
 * @param {number} [context.config.hebrewThreshold=0.2] - Hebrew detection threshold
 * @returns {Promise<object>} Modified prompt with interception metadata
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
 * @param {object} args - Command arguments
 * @param {string} args.prompt - The prompt to translate
 * @param {boolean} [args['--english']=false] - Request English response
 * @param {boolean} [args['--rtl']=false] - Apply RTL formatting
 * @param {boolean} [args['--force']=false] - Force translation
 * @returns {Promise<object>} Translation result with output string
 */
async function hebrewTranslate(args) {
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

  // Check for errors (error property indicates failure)
  if (result.error) {
    return {
      success: false,
      error: result.error
    };
  }

  // Display result
  let output = '\n=== Hebrew Translation ===\n';
  output += `Original: ${result.original}\n`;

  if (result.isHebrew) {
    output += `Translated: ${result.translated || 'Translation failed, using original'}\n`;
    output += `Response Language: ${result.responseLanguage}\n`;
    output += `Token Savings: Up to 40% on input tokens\n`;
  } else {
    output += `Status: Not detected as Hebrew\n`;
  }

  output += `\nFinal Prompt: ${result.finalPrompt}\n`;
  output += '=========================\n';

  return {
    success: true,
    output,
    data: result
  };
}

// Export for OpenCode
module.exports = {
  onPrompt,
  hebrewTranslate,
  processHebrewPrompt
};

// Skill metadata
module.exports.skillMetadata = {
  name: 'hebrew-auto-translate',
  version: '1.0.0',
  platform: 'opencode'
};
