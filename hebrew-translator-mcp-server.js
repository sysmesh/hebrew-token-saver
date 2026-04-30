#!/usr/bin/env node
/**
 * Hebrew Translator MCP Server (stdio)
 *
 * Speaks the Model Context Protocol over stdin/stdout.
 * Registers a "hebrew_translate" tool that Claude Code can call.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { isHebrew, translateHebrew, buildFinalPrompt } from './lib/common.js';

const server = new McpServer({
  name: 'hebrew-translator',
  version: '1.0.0'
});

server.tool('hebrew_translate', {
  _description: 'Translates Hebrew prompts to English and builds a final prompt requesting a Hebrew (or English) response',
  _inputSchema: {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'The Hebrew text to translate'
      },
      reply_in_english: {
        type: 'boolean',
        default: false,
        description: 'Request the LLM to reply in English instead of Hebrew'
      },
      force_translate: {
        type: 'boolean',
        default: false,
        description: 'Force translation even if text is not detected as Hebrew'
      }
    },
    required: ['prompt']
  },
  async *execute(args) {
    const { prompt, reply_in_english = false, force_translate = false } = args;

    const detectedHebrew = isHebrew(prompt) || force_translate;

    if (!detectedHebrew) {
      yield {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            is_hebrew: false,
            original: prompt,
            message: 'Text is not Hebrew, returning as-is'
          })
        }]
      };
      return;
    }

    let translated = prompt;
    let warning = null;

    try {
      const result = await translateHebrew(prompt);
      translated = result.translated;
    } catch (err) {
      warning = `Translation failed: ${err.message}. Using original text.`;
    }

    const { finalPrompt } = buildFinalPrompt(translated, {
      replyInEnglish: reply_in_english
    });

    const result = {
      success: !warning,
      is_hebrew: true,
      original: prompt,
      translated,
      final_prompt: finalPrompt,
      response_language: reply_in_english ? 'English' : 'Hebrew',
      usage_note: 'Send final_prompt to the LLM to get a response in the requested language'
    };

    if (warning) {
      result.translation_warning = warning;
    }

    yield {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Hebrew Translator MCP server running on stdio');
}

main().catch(err => {
  console.error('MCP server error:', err);
  process.exit(1);
});
