import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { MappingScopeTag } from './MappingScopeTag';
import type { UnifiedMapping } from '@/stores/useModelMappingsStore';
import styles from './UnifiedMappingTable.module.scss';

type SortField = 'sourceName' | 'targetModel' | 'scope';
type SortDirection = 'asc' | 'desc';

interface UnifiedMappingTableProps {
  mappings: UnifiedMapping[];
  onDelete: (mapping: UnifiedMapping) => void;
  onEdit: (mapping: UnifiedMapping) => void;
}

export function UnifiedMappingTable({ mappings, onDelete, onEdit }: UnifiedMappingTableProps) {
  const { t } = useTranslation();
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSourceName, setEditSourceName] = useState('');
  const [editTargetModel, setEditTargetModel] = useState('');

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField]);

  const sortedMappings = useMemo(() => {
    if (!sortField) return mappings;
    return [...mappings].sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [mappings, sortField, sortDirection]);

  const startEdit = useCallback((mapping: UnifiedMapping) => {
    setEditingId(mapping.id);
    setEditSourceName(mapping.sourceName);
    setEditTargetModel(mapping.targetModel);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditSourceName('');
    setEditTargetModel('');
  }, []);

  const saveEdit = useCallback((mapping: UnifiedMapping) => {
    if (!editSourceName.trim() || !editTargetModel.trim()) return;
    onEdit({
      ...mapping,
      sourceName: editSourceName.trim(),
      targetModel: editTargetModel.trim(),
    });
    setEditingId(null);
  }, [editSourceName, editTargetModel, onEdit]);

  const getSortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  if (mappings.length === 0) {
    return (
      <EmptyState
        title={t('model_mappings_page.no_mappings')}
        description={t('model_mappings_page.no_mappings_description')}
      />
    );
  }

  return (
    <div className={styles.table}>
      <div className={styles.tableHeader}>
        <span className={styles.sortable} onClick={() => handleSort('sourceName')}>
          {t('model_mappings_page.source_name')}{getSortIndicator('sourceName')}
        </span>
        <span className={styles.sortable} onClick={() => handleSort('targetModel')}>
          {t('model_mappings_page.target_model')}{getSortIndicator('targetModel')}
        </span>
        <span className={styles.sortable} onClick={() => handleSort('scope')}>
          {t('model_mappings_page.scope')}{getSortIndicator('scope')}
        </span>
        <span>{t('common.action')}</span>
      </div>
      {sortedMappings.map((mapping) => (
        <div key={mapping.id} className={styles.tableRow}>
          {editingId === mapping.id ? (
            <>
              <span>
                <input
                  type="text"
                  value={editSourceName}
                  onChange={(e) => setEditSourceName(e.target.value)}
                  className={styles.inlineInput}
                  autoFocus
                />
              </span>
              <span>
                <input
                  type="text"
                  value={editTargetModel}
                  onChange={(e) => setEditTargetModel(e.target.value)}
                  className={styles.inlineInput}
                />
              </span>
              <span>
                <MappingScopeTag scope={mapping.scope} channel={mapping.channel} />
              </span>
              <span className={styles.actions}>
                <Button variant="primary" size="sm" onClick={() => saveEdit(mapping)}>
                  {t('common.save')}
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  {t('common.cancel')}
                </Button>
              </span>
            </>
          ) : (
            <>
              <span className={styles.sourceName}>
                {mapping.sourceName}
                {mapping.fork && <span className={styles.badge}>fork</span>}
                {mapping.regex && <span className={styles.badge}>regex</span>}
              </span>
              <span className={styles.targetModel}>{mapping.targetModel}</span>
              <span>
                <MappingScopeTag scope={mapping.scope} channel={mapping.channel} />
              </span>
              <span className={styles.actions}>
                <Button variant="ghost" size="sm" onClick={() => startEdit(mapping)}>
                  {t('model_mappings_page.edit')}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(mapping)}>
                  {t('common.delete')}
                </Button>
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
