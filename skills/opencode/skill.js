/**
 * OpenCode Skill for Hebrew Auto-Translation (self-contained, zero deps)
 *
 * Installation:  npm run install-opencode
 *
 * Or manually:
 *   1. Copy this directory to ~/.opencode/skills/hebrew-auto-translate/
 *   2. Restart OpenCode
 *
 * Usage:
 * - Automatic: Just type in Hebrew
 * - Manual: /hebrew-translate "שלום עולם" [--english] [--rtl]
 */

/* ── Inline common.js (so the skill works standalone in ~/.opencode/skills/) ── */

const HTTPS = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const TRANSLATE_API_URL = process.env.HEBREW_TRANSLATE_API || 'https://api.mymemory.translated.net/get';
const TRANSLATE_FROM = 'iw';
const TRANSLATE_TO = 'en';
const MAX_TEXT_LENGTH = 800;

const RTL_OVERRIDE = '‮';
const RTL_POP = '‬';

const USAGE_FILE = path.join(os.homedir(), '.hebrew-translator-usage.json');

let lastApiCall = 0;
const API_CALL_DELAY = 1000;

function rateLimitApiCall() {
  const now = Date.now();
  const elapsed = now - lastApiCall;
  if (elapsed < API_CALL_DELAY) {
    return new Promise(r => setTimeout(r, API_CALL_DELAY - elapsed));
  }
  lastApiCall = now;
  return Promise.resolve();
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    HTTPS.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
      });
    }).on('error', reject);
  });
}

function isHebrew(text, threshold = 0.2) {
  if (!text || typeof text !== 'string') return false;
  const hebrewChars = text.match(/[֐-׿]/g);
  if (!hebrewChars || hebrewChars.length === 0) return false;
  return hebrewChars.length / text.length >= threshold;
}

function isSafePath(filePath) {
  const resolved = path.resolve(filePath);
  const homeDir = path.resolve(os.homedir());
  return resolved.replace(/\\/g, '/').startsWith(homeDir.replace(/\\/g, '/') + '/');
}

function getUsageData() {
  if (!isSafePath(USAGE_FILE)) return { dailyWords: 0, lastReset: Date.now() };
  try {
    if (fs.existsSync(USAGE_FILE)) return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
  } catch { /* ignore */ }
  return { dailyWords: 0, lastReset: Date.now() };
}

function saveUsageData(data) {
  if (!isSafePath(USAGE_FILE)) return;
  try { fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2)); } catch { /* ignore */ }
}

function shouldResetQuota(usage) {
  return (Date.now() - usage.lastReset) > (24 * 60 * 60 * 1000);
}

function trackTranslation(wordCount) {
  const usage = getUsageData();
  if (shouldResetQuota(usage)) { usage.dailyWords = 0; usage.lastReset = Date.now(); }
  usage.dailyWords += wordCount;
  saveUsageData(usage);
}

async function translateHebrew(text) {
  if (typeof text !== 'string') throw new Error('Input must be a string');
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Input cannot be empty');
  if (trimmed.length > MAX_TEXT_LENGTH) throw new Error(`Text too long: ${trimmed.length} chars (max ${MAX_TEXT_LENGTH})`);

  const url = `${TRANSLATE_API_URL}?q=${encodeURIComponent(trimmed)}&langpair=${TRANSLATE_FROM}|${TRANSLATE_TO}`;
  await rateLimitApiCall();
  const response = await httpGet(url);

  if (response.responseDetails && /limit|quota|rate limit/i.test(response.responseDetails)) {
    throw new Error(`API quota exceeded: ${response.responseDetails}`);
  }
  if (response.responseData && response.responseData.translatedText) {
    trackTranslation(trimmed.split(/\s+/).length);
    return { success: true, translated: response.responseData.translatedText, original: text };
  } else if (response.responseStatus) {
    throw new Error(`Translation API error: ${response.responseStatus}`);
  } else {
    throw new Error('Unexpected API response format');
  }
}

function applyRTLFormatting(text) {
  if (!text || typeof text !== 'string') return text;
  if (!/[֐-׿]/.test(text)) return text;
  return `${RTL_OVERRIDE}${text}${RTL_POP}`;
}

function buildFinalPrompt(translated, options = {}) {
  const { replyInEnglish = false, forceRTL = false } = options;
  const shouldApplyRTL = forceRTL && !replyInEnglish;

  let instruction = replyInEnglish ? 'Important! Reply in English only' : 'Important! Reply in Hebrew';
  if (shouldApplyRTL) instruction += ' Use RTL formatting with proper Unicode BIDI markers.';

  let finalPrompt = `${translated}. ${instruction}`;
  if (shouldApplyRTL && /[֐-׿]/.test(translated)) {
    finalPrompt = `${applyRTLFormatting(translated)}. ${instruction}`;
  }

  return { finalPrompt, instruction, rtlFormatted: shouldApplyRTL && /[֐-׿]/.test(translated) };
}

async function processHebrewPrompt(prompt, options = {}) {
  const { forceTranslate = false, replyInEnglish = false, forceRTL: _forceRtl = false, threshold = 0.2 } = options;

  const result = {
    success: true, original: prompt, isHebrew: false, translated: null,
    finalPrompt: prompt, responseLanguage: replyInEnglish ? 'English' : 'Hebrew',
    rtlFormatted: false, error: null
  };

  result.isHebrew = isHebrew(prompt, threshold) || forceTranslate;
  if (!result.isHebrew) return result;

  let translation;
  try {
    translation = await translateHebrew(prompt);
  } catch (error) {
    result.error = error.message;
    const fp = buildFinalPrompt(prompt, options);
    result.finalPrompt = fp.finalPrompt;
    result.rtlFormatted = fp.rtlFormatted;
    return result;
  }

  const fp = buildFinalPrompt(translation.translated, options);
  result.translated = translation.translated;
  result.finalPrompt = fp.finalPrompt;
  result.rtlFormatted = fp.rtlFormatted;
  return result;
}

/* ── OpenCode skill entry points ── */

async function onPrompt(prompt, context) {
  if (!context.config?.autoTranslate) return { prompt, intercepted: false };

  const result = await processHebrewPrompt(prompt, {
    replyInEnglish: context.config?.responseLanguage === 'english',
    forceRTL: context.config?.useRtlFormatting,
    threshold: context.config?.hebrewThreshold
  });

  return { prompt: result.finalPrompt, intercepted: result.isHebrew, metadata: result };
}

async function hebrewTranslate(args) {
  const prompt = args.prompt;
  if (!prompt) return { success: false, error: 'Please provide a Hebrew prompt to translate' };

  const result = await processHebrewPrompt(prompt, {
    replyInEnglish: args['--english'] || false,
    forceRTL: args['--rtl'] || false,
    forceTranslate: args['--force'] || false
  });

  if (result.error) return { success: false, error: result.error };

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

  return { success: true, output, data: result };
}

module.exports = { onPrompt, hebrewTranslate, processHebrewPrompt };

module.exports.skillMetadata = {
  name: 'hebrew-auto-translate',
  version: '1.0.0',
  platform: 'opencode'
};
