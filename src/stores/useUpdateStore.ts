/**
 * 一键更新状态管理
 */

import { create } from 'zustand';
import { updaterApi, type UpdateStatus } from '@/services/api/updater';
import i18n from '@/i18n';

type UpdateStatusType = 'idle' | 'checking' | 'available' | 'updating' | 'success' | 'error';

interface UpdateState {
  currentVersion: string;
  latestVersion: string | null;
  status: UpdateStatusType;
  progress: string;
  error: string | null;
  serviceAvailable: boolean;
  checkForUpdate: () => Promise<void>;
  startUpdate: () => Promise<void>;
  reset: () => void;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error
    ? error.message
    : typeof error === 'string'
      ? error
      : i18n.t('update.update_failed');

export const useUpdateStore = create<UpdateState>((set, get) => ({
  currentVersion: '',
  latestVersion: null,
  status: 'idle',
  progress: '',
  error: null,
  serviceAvailable: false,

  checkForUpdate: async () => {
    set({ status: 'checking', error: null });
    try {
      const data: UpdateStatus = await updaterApi.getStatus();
      set({
        currentVersion: data.currentVersion,
        latestVersion: data.latestVersion,
        status: data.updateAvailable ? 'available' : 'idle',
        serviceAvailable: true,
        error: null,
      });
    } catch (error: unknown) {
      set({
        status: 'error',
        error: getErrorMessage(error),
        serviceAvailable: false,
      });
    }
  },

  startUpdate: async () => {
    set({ status: 'updating', progress: i18n.t('update.updating'), error: null });
    try {
      const result = await updaterApi.startUpdate();
      if (result.success) {
        set({
          status: 'success',
          progress: result.message,
          currentVersion: result.newVersion || get().currentVersion,
          latestVersion: result.newVersion || get().latestVersion,
        });
      } else {
        set({ status: 'error', error: result.message });
      }
    } catch (error: unknown) {
      set({ status: 'error', error: getErrorMessage(error) });
    }
  },

  reset: () => {
    set({
      status: 'idle',
      progress: '',
      error: null,
    });
  },
}));
