#!/usr/bin/env node
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// lib/common.js
var require_common = __commonJS({
  "lib/common.js"(exports2, module2) {
    var HTTPS = require("https");
    var fs = require("fs");
    var path = require("path");
    var os = require("os");
    var TRANSLATE_API_URL = process.env.HEBREW_TRANSLATE_API || "https://api.mymemory.net/api/translate";
    var TRANSLATE_FROM = "iw";
    var TRANSLATE_TO = "en";
    var MAX_TEXT_LENGTH = 800;
    var RTL_OVERRIDE = "\u202E";
    var RTL_POP = "\u202C";
    var RTL_ISOLATE = "\u2067";
    var USAGE_FILE = path.join(os.homedir(), ".hebrew-translator-usage.json");
    var DAILY_QUOTA_WORDS = 5e3;
    function isSafePath(filePath) {
      const resolved = path.resolve(filePath);
      const homeDir = path.resolve(os.homedir());
      const normalizedResolved = resolved.replace(/\\/g, "/");
      const normalizedHome = homeDir.replace(/\\/g, "/");
      return normalizedResolved.startsWith(normalizedHome + "/");
    }
    function isHebrew2(text, threshold = 0.2) {
      if (!text || typeof text !== "string") return false;
      const hebrewChars = text.match(/[֐-׿]/g);
      if (!hebrewChars || hebrewChars.length === 0) return false;
      return hebrewChars.length / text.length >= threshold;
    }
    var lastApiCall = 0;
    var API_CALL_DELAY = 1e3;
    async function rateLimitApiCall() {
      const now = Date.now();
      const timeSinceLastCall = now - lastApiCall;
      if (timeSinceLastCall < API_CALL_DELAY) {
        await new Promise((resolve) => setTimeout(resolve, API_CALL_DELAY - timeSinceLastCall));
      }
      lastApiCall = Date.now();
    }
    function httpGet(url) {
      return new Promise((resolve, reject) => {
        HTTPS.get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => {
            data += chunk;
          });
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              resolve({ raw: data });
            }
          });
        }).on("error", reject);
      });
    }
    async function translateHebrew2(text) {
      if (typeof text !== "string") {
        throw new Error("Input must be a string");
      }
      const trimmed = text.trim();
      if (trimmed.length === 0) {
        throw new Error("Input cannot be empty");
      }
      if (trimmed.length > MAX_TEXT_LENGTH) {
        throw new Error(`Text too long: ${trimmed.length} chars (max ${MAX_TEXT_LENGTH}). Please split into smaller chunks.`);
      }
      const encoded = encodeURIComponent(trimmed);
      const url = `${TRANSLATE_API_URL}?q=${encoded}&langpair=${TRANSLATE_FROM}|${TRANSLATE_TO}`;
      await rateLimitApiCall();
      const response = await httpGet(url);
      if (response.responseDetails && (response.responseDetails.includes("limit") || response.responseDetails.includes("quota") || response.responseDetails.includes("rate limit"))) {
        throw new Error(`API quota exceeded: ${response.responseDetails}`);
      }
      if (response.responseData && response.responseData.translatedText) {
        const wordCount = trimmed.split(/\s+/).length;
        trackTranslation(wordCount);
        return {
          success: true,
          translated: response.responseData.translatedText,
          original: text
        };
      } else if (response.responseStatus) {
        throw new Error(`Translation API error: ${response.responseStatus}`);
      } else {
        throw new Error("Unexpected API response format");
      }
    }
    function applyRTLFormatting(text) {
      if (!text || typeof text !== "string") return text;
      if (!/[֐-׿]/.test(text)) return text;
      return `${RTL_OVERRIDE}${text}${RTL_POP}`;
    }
    function buildFinalPrompt2(translated, options = {}) {
      const { replyInEnglish = false, forceRTL = false } = options;
      const shouldApplyRTL = forceRTL && !replyInEnglish;
      let instruction = replyInEnglish ? "Important! Reply in English only" : "Important! Reply in Hebrew";
      if (shouldApplyRTL) {
        instruction += " Use RTL formatting with proper Unicode BIDI markers.";
      }
      let finalPrompt = `${translated}. ${instruction}`;
      if (shouldApplyRTL) {
        if (/[֐-׿]/.test(translated)) {
          finalPrompt = `${applyRTLFormatting(translated)}. ${instruction}`;
        }
      }
      return {
        finalPrompt,
        instruction,
        rtlFormatted: shouldApplyRTL && /[֐-׿]/.test(translated)
      };
    }
    async function processHebrewPrompt(prompt, options = {}) {
      const { forceTranslate = false, replyInEnglish = false, forceRTL = false, threshold = 0.2 } = options;
      const result = {
        success: true,
        original: prompt,
        isHebrew: false,
        translated: null,
        finalPrompt: prompt,
        responseLanguage: replyInEnglish ? "English" : "Hebrew",
        rtlFormatted: false,
        error: null
      };
      result.isHebrew = isHebrew2(prompt, threshold) || forceTranslate;
      if (!result.isHebrew) {
        return result;
      }
      let translation;
      try {
        translation = await translateHebrew2(prompt);
      } catch (error) {
        result.error = error.message;
        const { finalPrompt: finalPrompt2, rtlFormatted: rtlFormatted2 } = buildFinalPrompt2(prompt, options);
        result.finalPrompt = finalPrompt2;
        result.rtlFormatted = rtlFormatted2;
        return result;
      }
      const { finalPrompt, rtlFormatted } = buildFinalPrompt2(translation.translated, options);
      result.translated = translation.translated;
      result.finalPrompt = finalPrompt;
      result.rtlFormatted = rtlFormatted;
      return result;
    }
    function getUsageData() {
      if (!isSafePath(USAGE_FILE)) {
        console.error("Invalid usage file path, using fallback");
        return { dailyWords: 0, lastReset: Date.now() };
      }
      try {
        if (fs.existsSync(USAGE_FILE)) {
          const data = JSON.parse(fs.readFileSync(USAGE_FILE, "utf8"));
          return data;
        }
      } catch (error) {
        console.error("Failed to read usage file:", error.message);
      }
      return { dailyWords: 0, lastReset: Date.now() };
    }
    function saveUsageData(data) {
      if (!isSafePath(USAGE_FILE)) {
        console.error("Invalid usage file path, cannot save");
        return;
      }
      try {
        fs.writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
      } catch (error) {
        console.error("Failed to save usage file:", error.message);
      }
    }
    function shouldResetQuota(usage) {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1e3;
      return now - usage.lastReset > oneDay;
    }
    function trackTranslation(wordCount) {
      const usage = getUsageData();
      if (shouldResetQuota(usage)) {
        usage.dailyWords = 0;
        usage.lastReset = Date.now();
      }
      usage.dailyWords += wordCount;
      saveUsageData(usage);
      return {
        wordsUsed: usage.dailyWords,
        wordsRemaining: Math.max(0, DAILY_QUOTA_WORDS - usage.dailyWords),
        quotaExceeded: usage.dailyWords >= DAILY_QUOTA_WORDS
      };
    }
    function getRemainingQuota() {
      const usage = getUsageData();
      if (shouldResetQuota(usage)) {
        usage.dailyWords = 0;
        usage.lastReset = Date.now();
        saveUsageData(usage);
      }
      return {
        wordsUsed: usage.dailyWords,
        wordsRemaining: Math.max(0, DAILY_QUOTA_WORDS - usage.dailyWords),
        quotaExceeded: usage.dailyWords >= DAILY_QUOTA_WORDS
      };
    }
    module2.exports = {
      isHebrew: isHebrew2,
      httpGet,
      translateHebrew: translateHebrew2,
      applyRTLFormatting,
      buildFinalPrompt: buildFinalPrompt2,
      processHebrewPrompt,
      MAX_TEXT_LENGTH,
      RTL_OVERRIDE,
      RTL_POP,
      RTL_ISOLATE,
      TRANSLATE_API_URL,
      TRANSLATE_FROM,
      TRANSLATE_TO,
      USAGE_FILE,
      DAILY_QUOTA_WORDS,
      trackTranslation,
      getRemainingQuota
    };
  }
});

// hebrew-translator-mcp.js
var { isHebrew, translateHebrew, buildFinalPrompt } = require_common();
var readline = require("readline");
var reqId = 1;
function send(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");
}
function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }) + "\n");
}
function handleRequest(id, method, params = {}) {
  switch (method) {
    case "initialize":
      return send(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "hebrew-translator", version: "1.0.0" }
      });
    case "tools/list":
      return send(id, { tools: [{
        name: "hebrew_translate",
        description: "Translates Hebrew prompts to English and builds a final prompt requesting a Hebrew or English response",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "The Hebrew text to translate" },
            reply_in_english: { type: "boolean", default: false, description: "Request the LLM to reply in English instead of Hebrew" },
            force_translate: { type: "boolean", default: false, description: "Force translation even if text is not detected as Hebrew" }
          },
          required: ["prompt"]
        }
      }] });
    case "tools/call": {
      const args = params.arguments || {};
      (async () => {
        try {
          const prompt = args.prompt;
          const reply_in_english = args.reply_in_english || false;
          const force_translate = args.force_translate || false;
          if (!isHebrew(prompt) && !force_translate) {
            return send(id, { content: [{ type: "text", text: JSON.stringify({
              success: true,
              is_hebrew: false,
              original: prompt,
              final_prompt: prompt,
              message: "Text is not Hebrew, returning as-is"
            }) }] });
          }
          let translated = prompt;
          let warning = null;
          try {
            const result2 = await translateHebrew(prompt);
            translated = result2.translated;
          } catch (err) {
            warning = `Translation failed: ${err.message}. Using original text.`;
          }
          const { finalPrompt } = buildFinalPrompt(translated, { replyInEnglish: reply_in_english });
          const result = {
            success: !warning,
            is_hebrew: true,
            original: prompt,
            translated,
            final_prompt: finalPrompt,
            response_language: reply_in_english ? "English" : "Hebrew",
            usage_note: "Send final_prompt to the LLM"
          };
          if (warning) result.translation_warning = warning;
          send(id, { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] });
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
var rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => {
  try {
    const msg = JSON.parse(line.trim());
    if (msg.method) handleRequest(msg.id || reqId++, msg.method, msg.params);
  } catch {
  }
});
process.stderr.write("Hebrew Translator MCP server running on stdio\n");
