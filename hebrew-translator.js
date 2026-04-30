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

const { isHebrew, translateHebrew, processHebrewPrompt } = require('./lib/common');

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

// Export for use as module (re-export from shared lib)
module.exports = {
  isHebrew,
  translateHebrew,
  processHebrewPrompt
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
