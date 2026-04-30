/**
 * Unit tests for Hebrew detection and translation validation
 *
 * Run tests with: node test.js
 *
 * @module test
 */

const { isHebrew, translateHebrew, MAX_TEXT_LENGTH, buildFinalPrompt, applyRTLFormatting } = require('./lib/common');

/**
 * Run all detection tests
 * @returns {object} Test results with passed/failed counts
 */
function runDetectionTests() {
  console.log('Testing Hebrew Detection');
  console.log('========================\n');

  const detectionTestCases = [
    { text: 'שלום עולם', expected: true, description: 'Pure Hebrew' },
    { text: 'Hello World', expected: false, description: 'Pure English' },
    { text: 'מה הcapital של צרפת?', expected: true, description: 'Mixed Hebrew/English' },
    { text: 'What is the capital of France?', expected: false, description: 'Pure English' },
    { text: 'איך מכינים חלבה?', expected: true, description: 'Hebrew question' },
    { text: '', expected: false, description: 'Empty string' },
    { text: '12345', expected: false, description: 'Numbers only' },
    { text: 'שלום', expected: true, description: 'Single Hebrew word' },
    { text: 'Hi', expected: false, description: 'Short English' },
  ];

  let detectionPassed = 0;
  let detectionFailed = 0;

  detectionTestCases.forEach((tc, index) => {
    const result = isHebrew(tc.text);
    const status = result === tc.expected ? '✓ PASS' : '✗ FAIL';

    if (result === tc.expected) {
      detectionPassed++;
    } else {
      detectionFailed++;
    }

    console.log(`Test ${index + 1}: ${tc.description}`);
    console.log(`  Input: "${tc.text}"`);
    console.log(`  Expected: ${tc.expected}, Got: ${result} - ${status}`);
    console.log('');
  });

  console.log('========================');
  console.log(`Detection Results: ${detectionPassed} passed, ${detectionFailed} failed\n`);

  return { passed: detectionPassed, failed: detectionFailed };
}

/**
 * Run input validation tests
 * @returns {Promise<object>} Test results with passed/failed counts
 */
async function runValidationTests() {
  console.log('Testing Input Validation');
  console.log('========================\n');

  let validationPassed = 0;
  let validationFailed = 0;

  // Test empty text
  try {
    await translateHebrew('');
    console.log('Test 1: Empty text - ✗ FAIL (should have thrown error)');
    validationFailed++;
  } catch (e) {
    if (e.message === 'Input cannot be empty') {
      console.log('Test 1: Empty text - ✓ PASS');
      validationPassed++;
    } else {
      console.log(`Test 1: Empty text - ✗ FAIL (wrong error: ${e.message})`);
      validationFailed++;
    }
  }

  // Test text too long
  try {
    await translateHebrew('א'.repeat(MAX_TEXT_LENGTH + 1));
    console.log('Test 2: Text too long - ✗ FAIL (should have thrown error)');
    validationFailed++;
  } catch (e) {
    if (e.message.includes('Text too long')) {
      console.log(`Test 2: Text too long - ✓ PASS`);
      validationPassed++;
    } else {
      console.log(`Test 2: Text too long - ✗ FAIL (wrong error: ${e.message})`);
      validationFailed++;
    }
  }

  // Test valid text (will fail on network, but that's expected)
  try {
    await translateHebrew('שלום');
    console.log('Test 3: Valid text - ✓ PASS (network call attempted)');
    validationPassed++;
  } catch (e) {
    // Network errors are expected, but we want to make sure validation passed
    if (e.message.includes('Text too long') || e.message.includes('Input cannot be empty')) {
      console.log(`Test 3: Valid text - ✗ FAIL (validation error: ${e.message})`);
      validationFailed++;
    } else {
      console.log(`Test 3: Valid text - ✓ PASS (network error expected: ${e.code})`);
      validationPassed++;
    }
  }

  console.log('');
  console.log('========================');
  console.log(`Validation Results: ${validationPassed} passed, ${validationFailed} failed\n`);

  return { passed: validationPassed, failed: validationFailed };
}

/**
 * Run buildFinalPrompt tests
 * @returns {object} Test results with passed/failed counts
 */
function runBuildFinalPromptTests() {
  console.log('Testing buildFinalPrompt');
  console.log('========================\n');

  let promptPassed = 0;
  let promptFailed = 0;

  const promptTests = [
    {
      name: 'English response',
      translated: 'Hello world',
      options: { replyInEnglish: true },
      expectedInstruction: 'Important! Reply in English only'
    },
    {
      name: 'Hebrew response',
      translated: 'Hello world',
      options: { replyInEnglish: false },
      expectedInstruction: 'Important! Reply in Hebrew'
    },
    {
      name: 'RTL formatting with Hebrew',
      translated: 'שלום עולם',
      options: { replyInEnglish: false, forceRTL: true },
      shouldHaveRTL: true
    },
    {
      name: 'No RTL with English response',
      translated: 'Hello world',
      options: { replyInEnglish: true, forceRTL: true },
      shouldNotHaveRTL: true
    }
  ];

  for (const test of promptTests) {
    const result = buildFinalPrompt(test.translated, test.options);

    if (test.expectedInstruction && !result.instruction.includes(test.expectedInstruction)) {
      console.log(`Test: ${test.name} - ✗ FAIL`);
      console.log(`  Expected instruction to contain: ${test.expectedInstruction}`);
      console.log(`  Got: ${result.instruction}`);
      promptFailed++;
    } else if (test.shouldHaveRTL && !result.finalPrompt.includes('‮')) {
      console.log(`Test: ${test.name} - ✗ FAIL`);
      console.log(`  Expected RTL marker in final prompt`);
      promptFailed++;
    } else if (test.shouldNotHaveRTL && result.finalPrompt.includes('‮')) {
      console.log(`Test: ${test.name} - ✗ FAIL`);
      console.log(`  Did not expect RTL marker in final prompt`);
      promptFailed++;
    } else {
      console.log(`Test: ${test.name} - ✓ PASS`);
      promptPassed++;
    }
  }

  console.log('');
  console.log(`buildFinalPrompt Results: ${promptPassed} passed, ${promptFailed} failed\n`);

  return { passed: promptPassed, failed: promptFailed };
}

/**
 * Run applyRTLFormatting tests
 * @returns {object} Test results with passed/failed counts
 */
function runRTLFormattingTests() {
  console.log('Testing applyRTLFormatting');
  console.log('========================\n');

  let rtlPassed = 0;
  let rtlFailed = 0;

  const rtlTests = [
    {
      name: 'Hebrew text gets RTL markers',
      input: 'שלום עולם',
      shouldHaveRTL: true
    },
    {
      name: 'English text does not get RTL markers',
      input: 'Hello world',
      shouldHaveRTL: false
    },
    {
      name: 'Mixed text gets RTL markers',
      input: 'Hello שלום',
      shouldHaveRTL: true
    },
    {
      name: 'Empty string returns empty',
      input: '',
      shouldHaveRTL: false
    }
  ];

  for (const test of rtlTests) {
    const result = applyRTLFormatting(test.input);
    const hasRTL = result.includes('‮');

    if (test.shouldHaveRTL && !hasRTL) {
      console.log(`Test: ${test.name} - ✗ FAIL`);
      console.log(`  Expected RTL markers but none found`);
      rtlFailed++;
    } else if (test.shouldHaveRTL === false && hasRTL) {
      console.log(`Test: ${test.name} - ✗ FAIL`);
      console.log(`  Did not expect RTL markers but found them`);
      rtlFailed++;
    } else {
      console.log(`Test: ${test.name} - ✓ PASS`);
      rtlPassed++;
    }
  }

  console.log('');
  console.log(`applyRTLFormatting Results: ${rtlPassed} passed, ${rtlFailed} failed\n`);

  return { passed: rtlPassed, failed: rtlFailed };
}

/**
 * Run all tests and report summary
 * @returns {Promise<void>}
 */
async function runAllTests() {
  const detectionResults = runDetectionTests();
  const validationResults = await runValidationTests();
  const promptResults = runBuildFinalPromptTests();
  const rtlResults = runRTLFormattingTests();

  const totalPassed = detectionResults.passed + validationResults.passed + promptResults.passed + rtlResults.passed;
  const totalFailed = detectionResults.failed + validationResults.failed + promptResults.failed + rtlResults.failed;

  console.log('========================');
  console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
  console.log('========================');

  process.exit(totalFailed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
