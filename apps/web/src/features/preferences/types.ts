import type { RequestBody, SuccessResponse } from '@repo/user-data-client';

export type Preferences = SuccessResponse<'/preferences', 'get'>;
export type CreatePreferencesBody = RequestBody<'/preferences', 'post'>;
export type UpdatePreferencesBody = RequestBody<'/preferences', 'patch'>;
