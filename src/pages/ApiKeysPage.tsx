import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ApiKeyListCard } from '@/components/apiKeys/ApiKeyListCard';
import { ApiKeyEditModal } from '@/components/apiKeys/ApiKeyEditModal';
import { ApiKeyUsageCard } from '@/components/apiKeys/ApiKeyUsageCard';
import { ApiKeyBindingCard } from '@/components/apiKeys/ApiKeyBindingCard';
import { useApiKeysStore, type KeyMetadata } from '@/stores/useApiKeysStore';
import { useNotificationStore } from '@/stores';
import styles from './ApiKeysPage.module.scss';

export function ApiKeysPage() {
  const { t } = useTranslation();
  const {
    keys, loading, error, metadata, bindings, usage, usageLoading,
    fetchKeys, addKey, removeKey, setMetadata, removeMetadata,
    fetchBindings, saveBinding, removeBinding, fetchUsage,
  } = useApiKeysStore();
  const { showNotification } = useNotificationStore();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
    fetchBindings();
    fetchUsage();
  }, [fetchKeys, fetchBindings, fetchUsage]);

  const handleAddKey = useCallback(async (key: string) => {
    try {
      await addKey(key);
      showNotification(t('api_keys_page.created'), 'success');
    } catch {
      showNotification(t('common.error'), 'error');
    }
  }, [addKey, showNotification, t]);

  const handleDeleteKey = useCallback(async (index: number) => {
    const keyToDelete = keys[index];
    try {
      await removeKey(index);
      removeMetadata(keyToDelete);
      if (bindings[keyToDelete]) {
        await removeBinding(keyToDelete).catch(() => {});
      }
      if (selectedKey === keyToDelete) setSelectedKey(null);
      showNotification(t('api_keys_page.deleted'), 'success');
    } catch {
      showNotification(t('common.error'), 'error');
    }
  }, [keys, removeKey, removeMetadata, removeBinding, bindings, selectedKey, showNotification, t]);

  const handleCopyKey = useCallback(async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      showNotification(t('api_keys_page.copied'), 'success');
    } catch {
      // fallback
    }
  }, [showNotification, t]);

  const handleSaveMetadata = useCallback((key: string, meta: KeyMetadata) => {
    setMetadata(key, meta);
    showNotification(t('api_keys_page.updated'), 'success');
  }, [setMetadata, showNotification, t]);

  const handleSaveBinding = useCallback(async (authFiles: string[], models: string[]) => {
    if (!selectedKey) return;
    try {
      await saveBinding(selectedKey, authFiles, models);
      showNotification(t('api_keys_page.binding_saved'), 'success');
    } catch {
      showNotification(t('common.error'), 'error');
    }
  }, [selectedKey, saveBinding, showNotification, t]);

  const selectedUsage = selectedKey ? usage[selectedKey] : null;
  const selectedBinding = selectedKey ? bindings[selectedKey] : undefined;

  if (loading) {
    return (
      <div className={styles.page}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('api_keys_page.title')}</h1>
          <p className={styles.description}>{t('api_keys_page.description')}</p>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        <ApiKeyListCard
          keys={keys}
          metadata={metadata}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
          onAdd={handleAddKey}
          onDelete={handleDeleteKey}
          onCopy={handleCopyKey}
          onEdit={setEditingKey}
        />

        <div className={styles.detailPanel}>
          {selectedKey ? (
            <>
              <ApiKeyUsageCard usage={selectedUsage ?? null} loading={usageLoading} />
              <ApiKeyBindingCard
                keyValue={selectedKey}
                boundAuthFiles={selectedBinding?.authFiles ?? []}
                allowedModels={selectedBinding?.models ?? []}
                onSave={handleSaveBinding}
              />
            </>
          ) : (
            <Card className={styles.placeholder}>
              <p>{t('api_keys_page.select_key')}</p>
            </Card>
          )}
        </div>
      </div>

      <ApiKeyEditModal
        open={editingKey !== null}
        keyValue={editingKey ?? ''}
        metadata={editingKey ? metadata[editingKey] : undefined}
        onSave={handleSaveMetadata}
        onClose={() => setEditingKey(null)}
      />
    </div>
  );
}
