/**
 * API 密钥状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiKeysApi, apiKeyBindingsApi } from '@/services/api';
import type { APIKeyBindingDTO } from '@/services/api';
import { usageApi } from '@/services/api';
import i18n from '@/i18n';

export interface APIKeyEntry {
  key: string;
  name?: string;
  authFiles?: string[];
  models?: string[];
}

export interface KeyMetadata {
  name: string;
  note?: string;
}

export interface APIKeyUsageSnapshot {
  total_requests: number;
  total_tokens: number;
  models: Record<string, {
    total_requests: number;
    total_tokens: number;
    details?: Array<{
      timestamp: string;
      tokens: {
        input_tokens: number;
        output_tokens: number;
        total_tokens: number;
      };
    }>;
  }>;
}

export interface KeyBinding {
  authFiles: string[];
  models: string[];
}

interface ApiKeysState {
  keys: string[];
  loading: boolean;
  error: string | null;
  metadata: Record<string, KeyMetadata>;
  bindings: Record<string, KeyBinding>;
  usage: Record<string, APIKeyUsageSnapshot>;
  usageLoading: boolean;

  fetchKeys: () => Promise<void>;
  addKey: (key: string) => Promise<void>;
  removeKey: (index: number) => Promise<void>;
  replaceKeys: (keys: string[]) => Promise<void>;
  setMetadata: (key: string, meta: KeyMetadata) => void;
  removeMetadata: (key: string) => void;
  fetchBindings: () => Promise<void>;
  saveBinding: (key: string, authFiles: string[], models: string[]) => Promise<void>;
  removeBinding: (key: string) => Promise<void>;
  fetchUsage: () => Promise<void>;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : i18n.t('common.unknown_error');

export const useApiKeysStore = create<ApiKeysState>()(
  persist(
    (set, get) => ({
      keys: [],
      loading: false,
      error: null,
      metadata: {},
      bindings: {},
      usage: {},
      usageLoading: false,

      fetchKeys: async () => {
        set({ loading: true, error: null });
        try {
          const keys = await apiKeysApi.list();
          set({ keys, loading: false });
        } catch (error: unknown) {
          set({ loading: false, error: getErrorMessage(error) });
        }
      },

      addKey: async (key: string) => {
        const { keys } = get();
        const newKeys = [...keys, key];
        await apiKeysApi.replace(newKeys);
        set({ keys: newKeys });
      },

      removeKey: async (index: number) => {
        await apiKeysApi.delete(index);
        const { keys } = get();
        const newKeys = keys.filter((_, i) => i !== index);
        set({ keys: newKeys });
      },

      replaceKeys: async (keys: string[]) => {
        await apiKeysApi.replace(keys);
        set({ keys });
      },

      setMetadata: (key: string, meta: KeyMetadata) => {
        set((state) => ({
          metadata: { ...state.metadata, [key]: meta },
        }));
      },

      removeMetadata: (key: string) => {
        set((state) => {
          const next = { ...state.metadata };
          delete next[key];
          return { metadata: next };
        });
      },

      fetchBindings: async () => {
        try {
          const dtos = await apiKeyBindingsApi.list();
          const map: Record<string, KeyBinding> = {};
          for (const dto of dtos) {
            if (dto.key) {
              map[dto.key] = {
                authFiles: dto['auth-files'] ?? [],
                models: dto.models ?? [],
              };
            }
          }
          set({ bindings: map });
        } catch {
          // ignore — bindings may not be supported by older backends
        }
      },

      saveBinding: async (key: string, authFiles: string[], models: string[]) => {
        const { bindings } = get();
        const updated = { ...bindings, [key]: { authFiles, models } };
        const dtos: APIKeyBindingDTO[] = Object.entries(updated).map(([k, b]) => ({
          key: k,
          'auth-files': b.authFiles.length > 0 ? b.authFiles : undefined,
          models: b.models.length > 0 ? b.models : undefined,
        }));
        await apiKeyBindingsApi.replace(dtos);
        set({ bindings: updated });
      },

      removeBinding: async (key: string) => {
        await apiKeyBindingsApi.delete(key);
        set((state) => {
          const next = { ...state.bindings };
          delete next[key];
          return { bindings: next };
        });
      },

      fetchUsage: async () => {
        set({ usageLoading: true });
        try {
          const data = await usageApi.getUsage();
          const rawUsage = data?.usage ?? data;
          const apis = (rawUsage as Record<string, unknown>)?.apis;
          if (apis && typeof apis === 'object') {
            set({ usage: apis as Record<string, APIKeyUsageSnapshot>, usageLoading: false });
          } else {
            set({ usage: {}, usageLoading: false });
          }
        } catch {
          set({ usageLoading: false });
        }
      },
    }),
    {
      name: 'cpa-api-keys-metadata',
      partialize: (state) => ({ metadata: state.metadata }),
    }
  )
);
