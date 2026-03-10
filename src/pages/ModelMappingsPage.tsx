import { useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnifiedMappingTable } from '@/components/modelMappings/UnifiedMappingTable';
import { AddMappingModal } from '@/components/modelMappings/AddMappingModal';
import { useModelMappingsStore, type UnifiedMapping } from '@/stores/useModelMappingsStore';
import { useNotificationStore } from '@/stores';
import type { OAuthModelAliasEntry, AmpcodeModelMapping } from '@/types';
import styles from './ModelMappingsPage.module.scss';

type ScopeFilter = 'all' | 'oauth' | 'ampcode';

export function ModelMappingsPage() {
  const { t } = useTranslation();
  const {
    unifiedMappings, loading, error,
    fetchMappings, addOAuthAlias, removeOAuthAlias, addAmpcodeMapping, removeAmpcodeMapping,
  } = useModelMappingsStore();
  const { showNotification } = useNotificationStore();

  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const filteredMappings = scopeFilter === 'all'
    ? unifiedMappings
    : unifiedMappings.filter((m) => m.scope === scopeFilter);

  const existingNames = useMemo(
    () => unifiedMappings.map((m) => m.sourceName),
    [unifiedMappings]
  );

  const handleAdd = useCallback(async (data: {
    sourceName: string;
    targetModel: string;
    scope: 'oauth' | 'ampcode';
    channel: string;
    fork: boolean;
  }) => {
    try {
      if (data.scope === 'oauth') {
        const alias: OAuthModelAliasEntry = {
          name: data.sourceName,
          alias: data.targetModel,
          ...(data.fork ? { fork: true } : {}),
        };
        await addOAuthAlias(data.channel, alias);
      } else {
        const mapping: AmpcodeModelMapping = {
          from: data.sourceName,
          to: data.targetModel,
        };
        await addAmpcodeMapping(mapping);
      }
      showNotification(t('model_mappings_page.saved'), 'success');
      setShowAddModal(false);
    } catch {
      showNotification(t('common.error'), 'error');
    }
  }, [addOAuthAlias, addAmpcodeMapping, showNotification, t]);

  const handleDelete = useCallback(async (mapping: UnifiedMapping) => {
    try {
      if (mapping.scope === 'oauth' && mapping.channel) {
        await removeOAuthAlias(mapping.channel, mapping.sourceName);
      } else {
        await removeAmpcodeMapping(mapping.sourceName);
      }
      showNotification(t('model_mappings_page.deleted'), 'success');
    } catch {
      showNotification(t('common.error'), 'error');
    }
  }, [removeOAuthAlias, removeAmpcodeMapping, showNotification, t]);

  const handleEdit = useCallback(async (mapping: UnifiedMapping) => {
    try {
      if (mapping.scope === 'oauth' && mapping.channel) {
        const alias: OAuthModelAliasEntry = {
          name: mapping.sourceName,
          alias: mapping.targetModel,
          ...(mapping.fork ? { fork: true } : {}),
        };
        await addOAuthAlias(mapping.channel, alias);
      } else {
        const m: AmpcodeModelMapping = { from: mapping.sourceName, to: mapping.targetModel };
        await addAmpcodeMapping(m);
      }
      showNotification(t('model_mappings_page.saved'), 'success');
    } catch {
      showNotification(t('common.error'), 'error');
    }
  }, [addOAuthAlias, addAmpcodeMapping, showNotification, t]);

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
          <h1 className={styles.title}>{t('model_mappings_page.title')}</h1>
          <p className={styles.description}>{t('model_mappings_page.description')}</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>{t('model_mappings_page.add')}</Button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.filterBar}>
        {(['all', 'oauth', 'ampcode'] as ScopeFilter[]).map((scope) => (
          <button
            key={scope}
            className={`${styles.filterTab} ${scopeFilter === scope ? styles.active : ''}`}
            onClick={() => setScopeFilter(scope)}
          >
            {scope === 'all'
              ? t('model_mappings_page.all_scopes')
              : t(`model_mappings_page.scope_${scope}`)}
            <span className={styles.count}>
              {scope === 'all'
                ? unifiedMappings.length
                : unifiedMappings.filter((m) => m.scope === scope).length}
            </span>
          </button>
        ))}
      </div>

      <Card>
        <UnifiedMappingTable
          mappings={filteredMappings}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      </Card>

      <AddMappingModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAdd}
        existingNames={existingNames}
      />
    </div>
  );
}
