import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { SYSTEM_EXTRACTION_PROMPT } from '@/lib/ai/prompt';
import { validateAndCleanExtraction, ExistingEntitiesContext, ValidationResult } from '@/lib/ai/validator';

export interface ProviderRequestOptions {
  providerId: string; // 'gemini' | 'openai' | 'anthropic' | 'groq' | 'xai' | 'openrouter' | 'ollama' | 'lmstudio' | 'custom'
  apiKey: string;
  model: string;
  baseUrl?: string;
  chapterText: string;
  chapterTitle?: string;
  chapterNumber?: number;
  context?: ExistingEntitiesContext;
}

/**
 * BYOK Multi-Provider Extraction Engine
 * Executes direct API calls to the user's selected provider (No browser automation / No Playwright).
 */
export async function extractViaProvider(options: ProviderRequestOptions): Promise<{ extraction?: any; source: string; rawOutput?: string }> {
  const {
    providerId,
    apiKey,
    model,
    baseUrl,
    chapterText,
    chapterTitle,
    chapterNumber,
    context = { characters: [], abilities: [], items: [], locations: [], organizations: [] }
  } = options;

  const prompt = `${SYSTEM_EXTRACTION_PROMPT}

Chapter Title: ${chapterTitle || `Chapter ${chapterNumber || 1}`}
Chapter Number: ${chapterNumber || 1}

Chapter Text:
"""
${chapterText}
"""`;

  let rawOutput = '';
  let activeModelUsed = model;

  // 1. Google Gemini API (with Automatic Fallback for Deprecated/404 Models)
  if (providerId === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey);

    // Sanitize non-existent or deprecated Gemini model strings to standard Google AI Studio models
    const requestedModel = (model && !model.includes('2.5') && model !== 'gemini-1.5-pro') ? model : 'gemini-1.5-flash';

    const candidateModels = Array.from(new Set([
      requestedModel,
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.0-flash-exp',
      'gemini-pro'
    ])).filter(Boolean);

    let lastError: any = null;
    let succeeded = false;

    for (const candidate of candidateModels) {
      try {
        const geminiModel = genAI.getGenerativeModel({ model: candidate });
        const result = await geminiModel.generateContent(prompt);
        rawOutput = result.response.text();
        activeModelUsed = candidate;
        succeeded = true;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini model ${candidate} failed: ${err.message}. Trying fallback candidate...`);
      }
    }

    if (!succeeded) {
      throw lastError || new Error('All Gemini model candidates failed');
    }
  }
  // 2. OpenAI API
  else if (providerId === 'openai') {
    const openai = new OpenAI({ apiKey });
    activeModelUsed = model || 'gpt-4o';
    const response = await openai.chat.completions.create({
      model: activeModelUsed,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: prompt }]
    });
    rawOutput = response.choices[0]?.message?.content || '';
  }
  // 3. Anthropic Claude API
  else if (providerId === 'anthropic') {
    activeModelUsed = model || 'claude-3-5-sonnet-20241022';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: activeModelUsed,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const resData = await response.json();
    if (!response.ok) throw new Error(resData.error?.message || 'Anthropic API error');
    rawOutput = resData.content?.[0]?.text || '';
  }
  // 4. Groq Cloud API
  else if (providerId === 'groq') {
    const groqClient = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1'
    });

    activeModelUsed = (model && model !== 'gpt-3.5-turbo' && model !== 'gemini-1.5-flash') ? model : 'llama-3.3-70b-versatile';

    const response = await groqClient.chat.completions.create({
      model: activeModelUsed,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: prompt }]
    });
    rawOutput = response.choices[0]?.message?.content || '';
  }
  // 5. OpenAI-Compatible Providers (xAI, OpenRouter, Ollama, LM Studio, Custom)
  else {
    let targetBaseUrl = baseUrl;

    if (providerId === 'xai') targetBaseUrl = 'https://api.x.ai/v1';
    else if (providerId === 'openrouter') targetBaseUrl = 'https://openrouter.ai/api/v1';
    else if (providerId === 'ollama') targetBaseUrl = baseUrl || 'http://localhost:11434/v1';
    else if (providerId === 'lmstudio') targetBaseUrl = baseUrl || 'http://localhost:1234/v1';

    const client = new OpenAI({
      apiKey: apiKey || 'dummy-key',
      baseURL: targetBaseUrl
    });

    activeModelUsed = model || 'gpt-3.5-turbo';

    const response = await client.chat.completions.create({
      model: activeModelUsed,
      messages: [{ role: 'system', content: prompt }]
    });
    rawOutput = response.choices[0]?.message?.content || '';
  }

  const validation: ValidationResult = validateAndCleanExtraction(rawOutput, chapterText, context);

  if (!validation.valid) {
    throw new Error(`AI output failed schema validation: ${validation.errors.join(' | ')}`);
  }

  return {
    extraction: validation.data,
    source: `${providerId}:${activeModelUsed}`,
    rawOutput
  };
}
