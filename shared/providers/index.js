import { callOpenAI } from './openai.js';
import { callAnthropic } from './anthropic.js';
import { callGemini } from './gemini.js';
import { callMock } from './mock.js';

export async function callProvider(providerId, payload) {
  switch (providerId) {
    case 'openai':
      return callOpenAI(payload);
    case 'anthropic':
      return callAnthropic(payload);
    case 'gemini':
      return callGemini(payload);
    case 'mock':
    default:
      return callMock(payload);
  }
}
