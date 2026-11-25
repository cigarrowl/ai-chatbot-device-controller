import OpenAI from 'openai';
import { toolDefinitions } from '../tools/definitions.js';

// Groq is fully OpenAI-compatible. We just change baseURL.
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

export async function chatCompletion(
  messages: OpenAI.ChatCompletionMessageParam[],
  systemPrompt: string
): Promise<OpenAI.ChatCompletion> {
  return client.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    tools: toolDefinitions,
    tool_choice: 'auto',
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  });
}
