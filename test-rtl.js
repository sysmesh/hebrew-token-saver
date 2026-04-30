#!/usr/bin/env node

/**
 * Test RTL formatting functionality
 *
 * Run tests with: node test-rtl.js
 *
 * @module test-rtl
 */

const { processHebrewPrompt } = require('./hebrew-translator.js');

/**
 * Run RTL formatting tests
 * @returns {Promise<void>}
 */
async function runTests() {
  console.log('Testing RTL Formatting');
  console.log('======================\n');

  const tests = [
    {
      name: 'Basic Hebrew (no options)',
      prompt: 'שלום עולם',
      options: {},
      expectRTL: false,
      expectEnglish: false
    },
    {
      name: 'Hebrew with --english',
      prompt: 'שלום עולם',
      options: { replyInEnglish: true },
      expectRTL: false,
      expectEnglish: true
    },
    {
      name: 'Hebrew with --rtl',
      prompt: 'שלום עולם',
      options: { forceRTL: true },
      expectRTL: true,
      expectEnglish: false
    },
    {
      name: 'English prompt (no translation needed)',
      prompt: 'Hello world',
      options: {},
      expectRTL: false,
      expectEnglish: false
    }
  ];

  for (const test of tests) {
    console.log(`Test: ${test.name}`);
    console.log(`  Prompt: "${test.prompt}"`);

    const result = await processHebrewPrompt(test.prompt, test.options);

    console.log(`  Is Hebrew: ${result.isHebrew}`);
    console.log(`  RTL Formatted: ${result.rtlFormatted}`);
    console.log(`  Response Language: ${result.responseLanguage}`);
    console.log(`  Final Prompt: ${JSON.stringify(result.finalPrompt)}`);

    // Verify RTL markers
    const hasRLO = result.finalPrompt.includes('‮');
    const hasPDF = result.finalPrompt.includes('‬');

    if (test.expectRTL) {
      console.log(`  ✓ Has RLO marker: ${hasRLO}`);
      console.log(`  ✓ Has PDF marker: ${hasPDF}`);
    }

    console.log('');
  }

  // Test incompatibility
  console.log('Test: --rtl and --english incompatibility');
  console.log('  (Should exit with error)');
  console.log('  Run manually: node hebrew-translator.js "שלום עולם" --rtl --english');
}

runTests().catch(console.error);
