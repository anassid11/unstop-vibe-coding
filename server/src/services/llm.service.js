import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { env } from '../config/env.js';

let anthropic;
let openai;

/**
 * Provider-agnostic streaming. Yields plain text deltas.
 * messages: [{ role: 'user' | 'assistant', content: string }]
 */
export async function* streamCompletion({ system, messages, signal }) {
  switch (env.provider) {
    case 'anthropic': {
      anthropic ??= new Anthropic({ apiKey: env.anthropicKey });
      const stream = anthropic.messages.stream(
        { model: env.anthropicModel, max_tokens: 1500, system, messages },
        { signal }
      );
      for await (const ev of stream) {
        if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') yield ev.delta.text;
      }
      return;
    }
    case 'openai': {
      openai ??= new OpenAI({ apiKey: env.openaiKey });
      const stream = await openai.chat.completions.create(
        { model: env.openaiModel, stream: true, messages: [{ role: 'system', content: system }, ...messages] },
        { signal }
      );
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) yield text;
      }
      return;
    }
    case 'mock':
      yield* mockStream({ system, messages, signal });
      return;
    default:
      throw new Error(`Unknown LLM_PROVIDER "${env.provider}"`);
  }
}

// Offline fallback so the UI can be demoed without an API key.
async function* mockStream({ system, messages, signal }) {
  const last = messages.at(-1)?.content ?? '';
  const style = system.includes('concisely') ? 'concise' : system.includes('casual') ? 'casual' : 'professional';
  const replies = {
    concise: `Short answer to "${last.slice(0, 60)}": noted.`,
    casual: `Hey! You asked about "${last.slice(0, 60)}" 😄 Here's the gist: this is a mock reply, so plug in a real API key to get real answers.`,
    professional: `Thank you for your question regarding "${last.slice(0, 60)}". This is a mock response; configure a provider API key to receive a full answer.`,
  };
  for (const word of replies[style].split(/(\s+)/)) {
    if (signal?.aborted) return;
    await new Promise((r) => setTimeout(r, 40));
    yield word;
  }
}
