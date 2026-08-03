import { GoogleGenAI, Type } from '@google/genai';

import { handleApiResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';

import { Pack } from '../collection/types';

import { comfortOptions, luggageConstraintsOptions } from './constants';
import { generatedSchema } from './schema';
import { AssistantFormType, CreateAssistantPackBody, GeneratedPackingList } from './types';

import 'server-only';

// -------------------------------
// Create functions
// -------------------------------

export async function createAssistantPack(body: CreateAssistantPackBody): Promise<Pack> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/pack/assistant', { body });
  return handleApiResponse(data, error, response);
}

// -------------------------------
// AI Pack generation
// -------------------------------

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                note: { type: Type.STRING },
              },
              required: ['name', 'quantity'],
            },
          },
        },
        required: ['name', 'items'],
      },
    },
  },
  required: ['categories'],
};

function buildPrompt(payload: AssistantFormType): string {
  const lines = [
    payload.destination && `- Destination: ${payload.destination}`,
    payload.activity?.length && `- Activities: ${payload.activity.join(', ')}`,
    payload.comfort &&
      `- Comfort level: ${payload.comfort} (provided options: ${comfortOptions.map(({ value }) => value).join(', ')})`,
    payload.transportation?.length && `- Transportation: ${payload.transportation.join(', ')}`,
    payload.accomodationType?.length && `- Accommodation: ${payload.accomodationType.join(', ')}`,
    payload.luggageConstraints &&
      `- Luggage constraints: ${payload.luggageConstraints} (provided options: ${luggageConstraintsOptions.map(({ value }) => value).join(', ')})`,
    payload.laundryAccess && `- Laundry access: ${payload.laundryAccess}`,
    (payload.dateFrom || payload.dateUntil) &&
      `- Dates: ${payload.dateFrom || 'N/A'} to ${payload.dateUntil || 'N/A'}`,
    payload.nbPersons && `- Number of people: ${payload.nbPersons}`,
    payload.remarks && `- Extra remarks: ${payload.remarks}`,
  ]
    .filter(Boolean)
    .join('\n');

  return `Generate a packing list for this trip:
        ${lines}

        Group items into logical categories (clothing, toiletries, electronics, documents, etc). Scale quantities for the number of people, trip length, and laundry access.`;
}

export async function fetchPackingList(payload: AssistantFormType): Promise<GeneratedPackingList> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.5-flash-lite',
    contents: buildPrompt(payload),
    config: {
      responseMimeType: 'application/json',
      responseSchema,
    },
  });

  const raw = JSON.parse(response.text ?? '{}');

  return generatedSchema.parse(raw);
}
