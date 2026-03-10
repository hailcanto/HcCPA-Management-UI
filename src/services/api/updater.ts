/**
 * 伴生更新服务 API
 * 独立服务（端口 8318），用于一键更新 CLIProxyAPI
 */

import axios from 'axios';

const UPDATER_BASE_URL = 'http://localhost:8318';
const UPDATER_TIMEOUT_MS = 120_000;

const updaterClient = axios.create({
  baseURL: UPDATER_BASE_URL,
  timeout: UPDATER_TIMEOUT_MS,
});

export interface UpdateStatus {
  currentVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  updating: boolean;
  lastError?: string;
}

export interface UpdateResult {
  success: boolean;
  message: string;
  newVersion?: string;
}

export const updaterApi = {
  getStatus: () => updaterClient.get<UpdateStatus>('/status').then((r) => r.data),

  startUpdate: () => updaterClient.post<UpdateResult>('/update').then((r) => r.data),
};
