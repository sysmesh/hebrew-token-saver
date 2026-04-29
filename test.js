#!/usr/bin/env node

/**
 * Unit tests for Hebrew detection
 */

const { isHebrew } = require('./hebrew-translator.js');

console.log('Testing Hebrew Detection');
console.log('========================\n');

const testCases = [
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

let passed = 0;
let failed = 0;

testCases.forEach((tc, index) => {
  const result = isHebrew(tc.text);
  const status = result === tc.expected ? '✓ PASS' : '✗ FAIL';
  
  if (result === tc.expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`Test ${index + 1}: ${tc.description}`);
  console.log(`  Input: "${tc.text}"`);
  console.log(`  Expected: ${tc.expected}, Got: ${result} - ${status}`);
  console.log('');
});

console.log('========================');
console.log(`Results: ${passed} passed, ${failed} failed`);

process.exit(failed > 0 ? 1 : 0);
