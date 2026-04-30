#!/usr/bin/env node

/**
 * Hebrew Auto-Translate Skill - HYBRID VERSION
 *
 * Uses MyMemory API first, falls back to local Transformers.js model
 * when API fails or hits limits.
 *
 * Local model: Helsinki-NLP/opus-mt-he-en (~150MB)
 * Framework: @xenova/transformers (Transformers.js)
 */

const { isHebrew, translateHebrew, buildFinalPrompt } = require('./lib/common');

// Chunk size for large translations (API limit is 1000 chars)
const MAX_CHUNK_SIZE = 800; // Leave room for encoding overhead

// Global translator instance (cached after first load)
let localTranslator = null;
let translatorInitializing = false;

/**
 * Initialize local translator (Transformers.js)
 */
async function initializeLocalTranslator() {
  if (localTranslator) return localTranslator;

  if (translatorInitializing) {
    // Wait for existing initialization
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (localTranslator) {
          clearInterval(checkInterval);
          resolve(localTranslator);
        }
      }, 100);
    });
  }

  translatorInitializing = true;

  try {
    const { pipeline } = require('@xenova/transformers');

    console.log('Loading local translation model (Helsinki-NLP/opus-mt-he-en)...');
    console.log('(This may take a moment on first run)');

    // Use Xenova's version which works in Node.js
    localTranslator = await pipeline('translation', 'Xenova/opus-mt-he-en');

    console.log('Local model loaded successfully!');
    return localTranslator;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error(
        'Transformers.js not installed. Run: npm install @xenova/transformers'
      );
    }
    throw error;
  } finally {
    translatorInitializing = false;
  }
}

/**
 * Split text into chunks for translation
 */
function chunkText(text, chunkSize = MAX_CHUNK_SIZE) {
  const chunks = [];

  // Try to split on sentence boundaries
  const sentences = text.split(/(?<=[.!?])\s+/);

  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // If sentence-based splitting didn't work well, fall back to character-based
  if (chunks.length === 0 || (chunks.length === 1 && chunks[0].length > chunkSize)) {
    const simpleChunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      simpleChunks.push(text.slice(i, i + chunkSize));
    }
    return simpleChunks;
  }

  return chunks;
}

/**
 * Translate using local model
 */
async function translateLocal(text) {
  const translator = await initializeLocalTranslator();

  // Check if text needs chunking
  if (text.length <= MAX_CHUNK_SIZE) {
    const result = await translator(text);
    return result[0]?.translation_text || result.text || result;
  } else {
    // Chunk and translate
    const chunks = chunkText(text);
    const translatedChunks = [];

    for (let i = 0; i < chunks.length; i++) {
      console.log(`Translating chunk ${i + 1}/${chunks.length}...`);
      const result = await translator(chunks[i]);
      translatedChunks.push(result[0]?.translation_text || result.text || result);
    }

    return translatedChunks.join(' ');
  }
}

/**
 * Hybrid translation: API first, then local fallback
 */
async function translateHybrid(text, options = {}) {
  const { skipAPI = false, skipLocal = false } = options;

  // Try API first (unless skipped)
  if (!skipAPI) {
    try {
      const apiResult = await translateHebrew(text);
      return {
        success: true,
        translated: apiResult.translated,
        method: 'api'
      };
    } catch (error) {
      console.log(`API failed: ${error.message}`);
      console.log('Falling back to local model...');
    }
  }

  // Fall back to local (unless skipped)
  if (!skipLocal) {
    try {
      const translated = await translateLocal(text);
      return {
        success: true,
        translated,
        method: 'local'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Both methods skipped or failed
  return {
    success: false,
    error: 'Both API and local translation were skipped or failed'
  };
}

/**
 * Process Hebrew prompt with hybrid translation
 */
async function processHebrewPromptHybrid(prompt, options = {}) {
  const { replyInEnglish = false, forceRTL = false, forceTranslate = false, skipAPI = false, skipLocal = false } = options;

  const result = {
    original: prompt,
    isHebrew: false,
    translated: null,
    finalPrompt: prompt,
    responseLanguage: replyInEnglish ? 'English' : 'Hebrew',
    rtlFormatted: false,
    method: null,
    error: null
  };

  result.isHebrew = isHebrew(prompt) || forceTranslate;

  if (!result.isHebrew) {
    return result;
  }

  const translation = await translateHybrid(prompt, { skipAPI, skipLocal });

  if (translation.translated) {
    result.translated = translation.translated;
    result.method = translation.method;

    const { finalPrompt, rtlFormatted } = buildFinalPrompt(translation.translated, options);
    result.finalPrompt = finalPrompt;
    result.rtlFormatted = rtlFormatted;
  } else {
    result.error = translation.error;

    const { finalPrompt, rtlFormatted } = buildFinalPrompt(prompt, options);
    result.finalPrompt = finalPrompt;
    result.rtlFormatted = rtlFormatted;
  }

  return result;
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Hebrew Auto-Translate Skill (HYBRID VERSION)');
    console.log('============================================');
    console.log('');
    console.log('Usage: node hebrew-translator-hybrid.js <hebrew-text> [options]');
    console.log('');
    console.log('Options:');
    console.log('  --english    Force LLM to reply in English (not Hebrew)');
    console.log('  --rtl        Force RTL formatting for Hebrew output (incompatible with --english)');
    console.log('  --api-only   Use only MyMemory API (no local fallback)');
    console.log('  --local-only Use only local model (skip API)');
    console.log('  --force      Force translation even if not Hebrew');
    console.log('');
    console.log('Installation:');
    console.log('  npm install @xenova/transformers');
    console.log('');
    console.log('Examples:');
    console.log('  node hebrew-translator-hybrid.js "שלום עולם"');
    console.log('  node hebrew-translator-hybrid.js "שלום עולם" --english');
    console.log('  node hebrew-translator-hybrid.js "שלום עולם" --rtl');
    process.exit(0);
  }

  // Parse options
  const options = {
    replyInEnglish: args.includes('--english'),
    forceRTL: args.includes('--rtl'),
    skipAPI: args.includes('--local-only'),
    skipLocal: args.includes('--api-only'),
    forceTranslate: args.includes('--force')
  };

  // Validate: --rtl and --english are incompatible
  if (options.forceRTL && options.replyInEnglish) {
    console.error('Error: --rtl and --english options are incompatible.');
    console.error('RTL formatting only makes sense for Hebrew output.');
    process.exit(1);
  }

  // Remove options from args
  const prompt = args.filter(a => !a.startsWith('--')).join(' ');

  console.log('Original prompt:');
  console.log(prompt);
  console.log('');

  const result = await processHebrewPromptHybrid(prompt, options);

  console.log('Detection result:');
  console.log(`  Is Hebrew: ${result.isHebrew ? 'Yes ✓' : 'No'}`);
  console.log('');

  if (result.isHebrew) {
    if (result.translated) {
      console.log('Translation:');
      console.log(`  ${result.translated}`);
      console.log(`  Method: ${result.method === 'api' ? 'MyMemory API' : 'Local Model'}`);
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

  console.log('JSON output:');
  console.log(JSON.stringify(result, null, 2));
}

// Export
module.exports = {
  isHebrew,
  translateHebrew,
  translateLocal,
  translateHybrid,
  processHebrewPrompt: processHebrewPromptHybrid,
  processHebrewPromptHybrid,
  chunkText
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
