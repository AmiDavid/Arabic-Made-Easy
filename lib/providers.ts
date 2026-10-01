/**
 * Provider strategy: OpenAI-only by default (single paid account),
 * automatically upgrade to Anthropic + ElevenLabs when their keys are set.
 */

export const providers = {
  // Vision OCR: Claude Opus > GPT-4o. Use Claude if we have the key.
  vision: process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai',
  // Chat brain (Palestinian dialect): Claude is stronger, but GPT-4o works.
  chat: process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai',
  // TTS: ElevenLabs is much better for Arabic. Fallback to OpenAI TTS.
  tts: process.env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'openai',
  // STT: OpenAI Whisper only (best & only reasonable option).
  stt: 'openai' as const,
} as const;
