/**
 * 统一模型映射状态管理
 */

import { create } from 'zustand';
import { authFilesApi, ampcodeApi } from '@/services/api';
import type { AmpcodeModelMapping } from '@/types';
import type { OAuthModelAliasEntry } from '@/types';
import i18n from '@/i18n';

export interface UnifiedMapping {
  id: string;
  sourceName: string;
  targetModel: string;
  scope: 'oauth' | 'ampcode';
  channel?: string;
  fork?: boolean;
  regex?: boolean;
}

interface ModelMappingsState {
  oauthAliases: Record<string, OAuthModelAliasEntry[]>;
  ampcodeMapings: AmpcodeModelMapping[];
  unifiedMappings: UnifiedMapping[];
  loading: boolean;
  error: string | null;

  fetchMappings: () => Promise<void>;
  addOAuthAlias: (channel: string, alias: OAuthModelAliasEntry) => Promise<void>;
  removeOAuthAlias: (channel: string, name: string) => Promise<void>;
  addAmpcodeMapping: (mapping: AmpcodeModelMapping) => Promise<void>;
  removeAmpcodeMapping: (from: string) => Promise<void>;
  saveOAuthAliases: (channel: string, aliases: OAuthModelAliasEntry[]) => Promise<void>;
  saveAmpcodeMapings: (mappings: AmpcodeModelMapping[]) => Promise<void>;
}

const buildUnifiedMappings = (
  oauthAliases: Record<string, OAuthModelAliasEntry[]>,
  ampcodeMapings: AmpcodeModelMapping[]
): UnifiedMapping[] => {
  const result: UnifiedMapping[] = [];
  let counter = 0;

  Object.entries(oauthAliases).forEach(([channel, aliases]) => {
    aliases.forEach((alias) => {
      result.push({
        id: `oauth-${counter++}`,
        sourceName: alias.name,
        targetModel: alias.alias,
        scope: 'oauth',
        channel,
        fork: alias.fork,
      });
    });
  });

  ampcodeMapings.forEach((mapping) => {
    result.push({
      id: `ampcode-${counter++}`,
      sourceName: mapping.from,
      targetModel: mapping.to,
      scope: 'ampcode',
    });
  });

  return result;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : i18n.t('common.unknown_error');

export const useModelMappingsStore = create<ModelMappingsState>((set, get) => ({
  oauthAliases: {},
  ampcodeMapings: [],
  unifiedMappings: [],
  loading: false,
  error: null,

  fetchMappings: async () => {
    set({ loading: true, error: null });
    try {
      const [oauthAliases, ampcodeMapings] = await Promise.all([
        authFilesApi.getOauthModelAlias(),
        ampcodeApi.getModelMappings(),
      ]);
      set({
        oauthAliases,
        ampcodeMapings,
        unifiedMappings: buildUnifiedMappings(oauthAliases, ampcodeMapings),
        loading: false,
      });
    } catch (error: unknown) {
      set({ loading: false, error: getErrorMessage(error) });
    }
  },

  addOAuthAlias: async (channel: string, alias: OAuthModelAliasEntry) => {
    const { oauthAliases, ampcodeMapings } = get();
    const current = oauthAliases[channel] || [];
    const updated = [...current, alias];
    await authFilesApi.saveOauthModelAlias(channel, updated);
    const newAliases = { ...oauthAliases, [channel]: updated };
    set({
      oauthAliases: newAliases,
      unifiedMappings: buildUnifiedMappings(newAliases, ampcodeMapings),
    });
  },

  removeOAuthAlias: async (channel: string, name: string) => {
    const { oauthAliases, ampcodeMapings } = get();
    const current = oauthAliases[channel] || [];
    const updated = current.filter((a) => a.name !== name);
    await authFilesApi.saveOauthModelAlias(channel, updated);
    const newAliases = { ...oauthAliases, [channel]: updated };
    set({
      oauthAliases: newAliases,
      unifiedMappings: buildUnifiedMappings(newAliases, ampcodeMapings),
    });
  },

  addAmpcodeMapping: async (mapping: AmpcodeModelMapping) => {
    const { oauthAliases, ampcodeMapings } = get();
    const updated = [...ampcodeMapings, mapping];
    await ampcodeApi.saveModelMappings(updated);
    set({
      ampcodeMapings: updated,
      unifiedMappings: buildUnifiedMappings(oauthAliases, updated),
    });
  },

  removeAmpcodeMapping: async (from: string) => {
    const { oauthAliases, ampcodeMapings } = get();
    const updated = ampcodeMapings.filter((m) => m.from !== from);
    await ampcodeApi.saveModelMappings(updated);
    set({
      ampcodeMapings: updated,
      unifiedMappings: buildUnifiedMappings(oauthAliases, updated),
    });
  },

  saveOAuthAliases: async (channel: string, aliases: OAuthModelAliasEntry[]) => {
    await authFilesApi.saveOauthModelAlias(channel, aliases);
    const { oauthAliases, ampcodeMapings } = get();
    const newAliases = { ...oauthAliases, [channel]: aliases };
    set({
      oauthAliases: newAliases,
      unifiedMappings: buildUnifiedMappings(newAliases, ampcodeMapings),
    });
  },

  saveAmpcodeMapings: async (mappings: AmpcodeModelMapping[]) => {
    await ampcodeApi.saveModelMappings(mappings);
    const { oauthAliases } = get();
    set({
      ampcodeMapings: mappings,
      unifiedMappings: buildUnifiedMappings(oauthAliases, mappings),
    });
  },
}));
