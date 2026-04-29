# Local Hebrew Translation Research

## API Limitations to Overcome

| Limitation | MyMemory | Google | DeepL |
|------------|----------|--------|-------|
| Daily quota | 1000 words | $200 credit | 500k chars |
| Request size | 1000 chars | 5000 chars | 5000 chars |
| API key | No | Yes | Yes |

## Local Solutions

### 1. Hugging Face Transformers (Node.js)

**Model**: `Helsinki-NLP/opus-mt-he-en`
- Size: ~150MB
- Framework: Transformers.js
- Quality: Good for general text
- Speed: ~500-1000 chars/sec on M1/M2

```javascript
const { pipeline } = require('@xenova/transformers');
const translator = pipeline('translation', 'Xenova/opus-mt-he-en');
const result = await translator('שלום עולם');
```

**Pros**: 
- Completely offline
- No limits
- Good quality

**Cons**:
- 150MB download
- Slower than API (~200ms per request)
- Requires Node.js

---

### 2. ONNX Runtime (Cross-platform)

**Model**: OPUS-MT converted to ONNX
- Size: ~60MB (quantized)
- Framework: onnxruntime-node
- Quality: Same as Hugging Face

```javascript
const ort = require('onnxruntime-node');
const session = await ort.InferenceSession.create_files('model.onnx');
```

**Pros**:
- Faster than Transformers.js
- Cross-platform
- Small footprint

**Cons**:
- Need to convert model first
- More setup required

---

### 3. LangChain.js + Local LLM

**Model**: Llama 3.1 8B, Mistral 7B
- Size: 4-8GB
- Framework: llama-cpp-node, Ollama
- Quality: Excellent (context-aware)

```javascript
const { Ollama } = require('langchain/llms/ollama');
const llm = new Ollama({ model: 'llama3.1' });
const result = await llm.invoke('Translate to English: שלום עולם');
```

**Pros**:
- Best quality
- Can handle context
- Can do more than translation

**Cons**:
- Very large (4-8GB)
- Slow (~50 tokens/sec)
- Overkill for simple translation

---

### 4. Hybrid Approach (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    Translation Pipeline                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Small prompts (<200 chars)                                │
│       ↓                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Option A: MyMemory API (free, fast, no setup)     │   │
│  │  - Use when under daily limit                       │   │
│  │  - Fall back to local when over limit               │   │
│  └─────────────────────────────────────────────────────┘   │
│       ↓                                                     │
│  Large prompts (>200 chars) or API over limit              │
│       ↓                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Option B: Local Transformers.js                    │   │
│  │  - Helsinki-NLP/opus-mt-he-en (150MB)              │   │
│  │  - No limits, completely offline                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Recommendation

**For this skill, I recommend:**

1. **Primary**: MyMemory API (for small prompts, when under limit)
2. **Fallback**: Transformers.js with `Helsinki-NLP/opus-mt-he-en`

This gives:
- ✓ No daily limits (local fallback)
- ✓ No size limits (local fallback)
- ✓ Fast for small prompts (API)
- ✓ Works offline (local)
- ✓ Reasonable download size (150MB)

## Implementation Plan

```javascript
async function translate(text) {
  // Try API first
  try {
    return await translateViaAPI(text);
  } catch (error) {
    // Fall back to local
    console.log('API failed, using local model...');
    return await translateLocal(text);
  }
}

async function translateLocal(text) {
  // Load model once (cached)
  if (!translator) {
    translator = await pipeline('translation', 'Xenova/opus-mt-he-en');
  }
  return await translator(text);
}
```

## Model Comparison

| Model | Size | Speed | Quality | Setup |
|-------|------|-------|---------|-------|
| MyMemory API | 0MB | 100ms | Good | None |
| opus-mt-he-en | 150MB | 200ms | Good | npm install |
| Llama 3.1 8B | 4.7GB | 50 tok/s | Excellent | Ollama |

## Final Recommendation

**Use Transformers.js with opus-mt-he-en**:
- 150MB is reasonable for a translation model
- No API limits
- Works offline
- Good quality for most use cases
- Easy to set up (just npm install)

For users who want better quality, they can optionally configure a local LLM.
