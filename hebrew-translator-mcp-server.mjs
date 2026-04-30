#!/usr/bin/env node
/**
 * Hebrew Translator MCP Server (stdio)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

function isHebrew(text, threshold = 0.2) {
  if (!text || typeof text !== 'string') return false;
  const hebrewChars = text.match(/[֐-׿]/g);
  if (!hebrewChars || hebrewChars.length === 0) return false;
  return hebrewChars.length / text.length >= threshold;
}

async function translateHebrew(text) {
  const url = `https://api.mymemory.net/api/translate?q=${encodeURIComponent(text.trim())}&langpair=iw|en`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }
  throw new Error(data.responseDetails || 'Translation failed');
}

const server = new McpServer({ name: 'hebrew-translator', version: '1.0.0' });

server.tool(
  'hebrew_translate',
  'Translates Hebrew prompts to English and builds a final prompt requesting a Hebrew or English response',
  {
    prompt: z.string().describe('The Hebrew text to translate'),
    reply_in_english: z.boolean().optional().default(false).describe('Request the LLM to reply in English instead of Hebrew'),
    force_translate: z.boolean().optional().default(false).describe('Force translation even if text is not detected as Hebrew')
  },
  async ({ prompt, reply_in_english = false, force_translate = false }) => {
    const detectedHebrew = isHebrew(prompt) || force_translate;

    if (!detectedHebrew) {
      return {
        content: [{ type: 'text', text: JSON.stringify({
          success: true,
          is_hebrew: false,
          original: prompt,
          final_prompt: prompt,
          message: 'Text is not Hebrew, returning as-is'
        }) }]
      };
    }

    let translated = prompt;
    let warning = null;

    try {
      translated = await translateHebrew(prompt);
    } catch (err) {
      warning = `Translation failed: ${err.message}. Using original text.`;
    }

    const instruction = reply_in_english
      ? 'Important! Reply in English only'
      : 'Important! Reply in Hebrew';

    const finalPrompt = `${translated}. ${instruction}`;

    return {
      content: [{ type: 'text', text: JSON.stringify({
        success: !warning,
        is_hebrew: true,
        original: prompt,
        translated,
        final_prompt: finalPrompt,
        response_language: reply_in_english ? 'English' : 'Hebrew',
        ...(warning && { translation_warning: warning }),
        usage_note: 'Send final_prompt to the LLM'
      }, null, 2) }]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('Hebrew Translator MCP server running on stdio\n');
}

main().catch(err => {
  process.stderr.write(`MCP server error: ${err}\n`);
  process.exit(1);
});
