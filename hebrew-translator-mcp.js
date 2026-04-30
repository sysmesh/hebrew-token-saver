/**
 * Hebrew Translator MCP Server — zero dependencies, Node.js built-ins only.
 * Speaks the Model Context Protocol (JSON-RPC 2.0) over stdin/stdout.
 * Registers a "hebrew_translate" tool that Claude Code can call.
 */

const { isHebrew, translateHebrew, buildFinalPrompt } = require('./lib/common');
const readline = require('readline');

let reqId = 1;

function send(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

function handleRequest(id, method, params = {}) {
  switch (method) {
    case 'initialize':
      return send(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'hebrew-translator', version: '1.0.0' }
      });

    case 'tools/list':
      return send(id, { tools: [{
        name: 'hebrew_translate',
        description: 'Translates Hebrew prompts to English and builds a final prompt requesting a Hebrew or English response',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: { type: 'string', description: 'The Hebrew text to translate' },
            reply_in_english: { type: 'boolean', default: false, description: 'Request the LLM to reply in English instead of Hebrew' },
            force_translate: { type: 'boolean', default: false, description: 'Force translation even if text is not detected as Hebrew' }
          },
          required: ['prompt']
        }
      }] });

    case 'tools/call': {
      const args = params.arguments || {};
      (async () => {
        try {
          const prompt = args.prompt;
          const reply_in_english = args.reply_in_english || false;
          const force_translate = args.force_translate || false;

          if (!isHebrew(prompt) && !force_translate) {
            return send(id, { content: [{ type: 'text', text: JSON.stringify({
              success: true, is_hebrew: false, original: prompt, final_prompt: prompt,
              message: 'Text is not Hebrew, returning as-is'
            }) }] });
          }

          let translated = prompt;
          let warning = null;

          try {
            const result = await translateHebrew(prompt);
            translated = result.translated;
          } catch (err) {
            warning = `Translation failed: ${err.message}. Using original text.`;
          }

          const { finalPrompt } = buildFinalPrompt(translated, { replyInEnglish: reply_in_english });

          const result = {
            success: !warning, is_hebrew: true, original: prompt, translated,
            final_prompt: finalPrompt,
            response_language: reply_in_english ? 'English' : 'Hebrew',
            usage_note: 'Send final_prompt to the LLM'
          };

          if (warning) result.translation_warning = warning;

          send(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
        } catch (err) {
          sendError(id, -32603, err.message);
        }
      })();
      return;
    }

    default:
      return sendError(id, -32601, `Unknown method: ${method}`);
  }
}

// Read JSON-RPC messages from stdin
const rl = readline.createInterface({ input: process.stdin });

rl.on('line', (line) => {
  try {
    const msg = JSON.parse(line.trim());
    if (msg.method) handleRequest(msg.id || reqId++, msg.method, msg.params);
  } catch { /* ignore malformed input */ }
});

process.stderr.write('Hebrew Translator MCP server running on stdio\n');
