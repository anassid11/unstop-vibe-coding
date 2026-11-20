// Tone definitions live on the server: the client only sends a tone id,
// the server turns it into a system-instruction modifier.
export const TONES = {
  professional: {
    label: 'Professional',
    description: 'Polished, precise, business-ready',
    instruction:
      'Respond in a professional tone: polished, precise and courteous. Use complete sentences and clear structure. Avoid slang and emojis.',
  },
  casual: {
    label: 'Casual',
    description: 'Friendly and conversational',
    instruction:
      'Respond in a casual, friendly tone, like chatting with a smart friend. Use contractions and plain language. Light humour and an occasional emoji are fine.',
  },
  concise: {
    label: 'Concise',
    description: 'Short and direct',
    instruction:
      'Respond as concisely as possible. Give the answer directly in a few short sentences or bullets. No preamble, no filler, never restate the question.',
  },
};

export const DEFAULT_TONE = 'professional';
export const isValidTone = (t) => Object.hasOwn(TONES, t);

const BASE_PROMPT = 'You are a helpful, accurate AI assistant. Format answers in Markdown when it helps readability.';

export function buildSystemPrompt(tone) {
  const t = isValidTone(tone) ? tone : DEFAULT_TONE;
  return `${BASE_PROMPT}\n\nStyle instruction: ${TONES[t].instruction}`;
}

export function listTones() {
  return Object.entries(TONES).map(([id, { label, description }]) => ({ id, label, description }));
}
