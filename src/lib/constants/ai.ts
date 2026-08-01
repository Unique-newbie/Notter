/**
 * @module AIConstants
 * @description Constants for AI providers, models, and default prompts.
 */

/**
 * Supported AI providers.
 */
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GOOGLE: 'google',
} as const;

/**
 * Model mappings for AI features.
 */
export const AI_MODELS = {
  EXTRACTION: 'gpt-4o',
  SUMMARY: 'gpt-3.5-turbo',
  CHAT: 'gpt-4o-mini',
} as const;

/**
 * Default prompts used by the AI engine.
 */
export const DEFAULT_PROMPTS = {
  EXTRACT_ENTITIES: 'You are an expert editor. Extract all characters, locations, items, and abilities from the provided text.',
  SUMMARIZE_CHAPTER: 'Summarize the given chapter in 3-5 sentences.',
} as const;
