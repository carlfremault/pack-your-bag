import { handleApiResponse } from '@/lib/api-handlers';
import { getProductClient } from '@/lib/clients/product-client';

import { Pack } from '../collection/types';

import { CreateAssistantPackBody } from './types';

import 'server-only';

export async function createAssistantPack(body: CreateAssistantPackBody): Promise<Pack> {
  const productClient = await getProductClient();
  const { data, error, response } = await productClient.POST('/pack/assistant', { body });
  return handleApiResponse(data, error, response);
}
