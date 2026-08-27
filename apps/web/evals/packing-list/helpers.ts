import { type Content, GoogleGenAI } from '@google/genai';

interface ChatOptions {
  system?: string;
  temperature?: number;
  stopSequences?: string[];
  responseMimeType?: string;
  responseSchema?: object;
}

type InputFieldSpec = {
  type: 'string' | 'array';
  description: string;
};

export type PromptInputsSpec = Record<string, InputFieldSpec>;

const MODEL = 'gemini-3.5-flash-lite';

// /////////
// Utilities
// /////////

export function renderPrompt(templateString: string, variables: Record<string, unknown>): string {
  return templateString
    .replace(/\{([^{}]+)\}/g, (match, key) => (key in variables ? String(variables[key]) : match))
    .replace(/\{\{/g, '{')
    .replace(/\}\}/g, '}');
}

export function formatPromptInputs(promptInputsSpec: PromptInputsSpec): string {
  return Object.entries(promptInputsSpec)
    .map(([key, spec]) => `- ${key} (${spec.type}): ${spec.description}`)
    .join('\n');
}

export function buildPromptInputsSchema(promptInputsSpec: PromptInputsSpec) {
  return {
    type: 'object',
    properties: Object.fromEntries(
      Object.entries(promptInputsSpec).map(([key, spec]) => [
        key,
        spec.type === 'array'
          ? { type: 'array', items: { type: 'string' }, description: spec.description }
          : { type: 'string', description: spec.description },
      ]),
    ),
    required: Object.keys(promptInputsSpec),
  };
}

// //////////
// AI Helpers
// //////////

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function addUserMessage(messages: Content[], text: string) {
  messages.push({
    role: 'user',
    parts: [{ text }],
  });
}

export function addAssistantMessage(messages: Content[], text: string) {
  messages.push({
    role: 'model',
    parts: [{ text }],
  });
}

export async function chat(messages: Content[], options: ChatOptions = {}): Promise<string> {
  const {
    system,
    temperature = 1.0,
    stopSequences = [],
    responseMimeType,
    responseSchema,
  } = options;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: messages,
    config: {
      temperature,
      stopSequences,
      systemInstruction: system,
      maxOutputTokens: 4000,
      responseMimeType,
      responseSchema,
    },
  });

  return response.text ?? '';
}
