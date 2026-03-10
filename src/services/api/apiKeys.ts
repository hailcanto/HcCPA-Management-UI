/**
 * API 密钥管理
 */

import { apiClient } from './client';

export interface APIKeyBindingDTO {
  key: string;
  name?: string;
  'auth-files'?: string[];
  models?: string[];
}

export const apiKeysApi = {
  async list(): Promise<string[]> {
    const data = await apiClient.get<Record<string, unknown>>('/api-keys');
    const keys = data['api-keys'] ?? data.apiKeys;
    return Array.isArray(keys) ? keys.map((key) => String(key)) : [];
  },

  replace: (keys: string[]) => apiClient.put('/api-keys', keys),

  update: (index: number, value: string) => apiClient.patch('/api-keys', { index, value }),

  delete: (index: number) => apiClient.delete(`/api-keys?index=${index}`),
};

export const apiKeyBindingsApi = {
  async list(): Promise<APIKeyBindingDTO[]> {
    const data = await apiClient.get<Record<string, unknown>>('/api-key-bindings');
    const bindings = data['api-key-bindings'] ?? data.apiKeyBindings;
    return Array.isArray(bindings) ? bindings : [];
  },

  replace: (bindings: APIKeyBindingDTO[]) => apiClient.put('/api-key-bindings', bindings),

  delete: (key: string) => apiClient.delete(`/api-key-bindings?key=${encodeURIComponent(key)}`),
};
