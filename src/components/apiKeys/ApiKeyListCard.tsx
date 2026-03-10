import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import type { KeyMetadata } from '@/stores/useApiKeysStore';
import styles from './ApiKeyListCard.module.scss';

interface ApiKeyListCardProps {
  keys: string[];
  metadata: Record<string, KeyMetadata>;
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onAdd: (key: string) => Promise<void>;
  onDelete: (index: number) => Promise<void>;
  onCopy: (key: string) => void;
  onEdit: (key: string) => void;
}

const maskKey = (key: string) => {
  if (key.length <= 8) return '****';
  return key.slice(0, 6) + '****' + key.slice(-4);
};

export function ApiKeyListCard({
  keys, metadata, selectedKey, onSelect, onAdd, onDelete, onCopy, onEdit,
}: ApiKeyListCardProps) {
  const { t } = useTranslation();
  const [showAddInput, setShowAddInput] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState('');
  const [search, setSearch] = useState('');

  const filteredKeys = useMemo(() => {
    if (!search.trim()) return keys;
    const q = search.toLowerCase();
    return keys.filter((key) => {
      const meta = metadata[key];
      return key.toLowerCase().includes(q) || meta?.name?.toLowerCase().includes(q);
    });
  }, [keys, search, metadata]);

  const generateRandomKey = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = 'sk-';
    for (let i = 0; i < 48; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewKeyValue(result);
  }, []);

  const handleAdd = useCallback(async () => {
    if (!newKeyValue.trim()) return;
    await onAdd(newKeyValue.trim());
    setNewKeyValue('');
    setShowAddInput(false);
  }, [newKeyValue, onAdd]);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h3>{t('nav.api_keys')}</h3>
        <Button size="sm" onClick={() => setShowAddInput(true)}>{t('api_keys_page.add')}</Button>
      </div>

      {keys.length > 3 && (
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('common.search', { defaultValue: 'Search...' })}
          className={styles.searchInput}
        />
      )}

      {showAddInput && (
        <div className={styles.addForm}>
          <input
            type="text"
            value={newKeyValue}
            onChange={(e) => setNewKeyValue(e.target.value)}
            placeholder={t('api_keys_page.key_placeholder')}
            className={styles.input}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <Button variant="ghost" size="sm" onClick={generateRandomKey}>
            {t('api_keys_page.generate')}
          </Button>
          <Button size="sm" onClick={handleAdd}>{t('common.add')}</Button>
          <Button variant="ghost" size="sm" onClick={() => { setShowAddInput(false); setNewKeyValue(''); }}>
            {t('common.cancel')}
          </Button>
        </div>
      )}

      {filteredKeys.length === 0 ? (
        <EmptyState title={t('api_keys_page.no_keys')} description={t('api_keys_page.no_keys_description')} />
      ) : (
        <div className={styles.list}>
          {filteredKeys.map((key) => {
            const meta = metadata[key];
            const originalIndex = keys.indexOf(key);
            return (
              <div
                key={key}
                className={`${styles.item} ${selectedKey === key ? styles.selected : ''}`}
                onClick={() => onSelect(key)}
              >
                <div className={styles.info}>
                  <span className={styles.name}>{meta?.name || maskKey(key)}</span>
                  <span className={styles.value}>{maskKey(key)}</span>
                </div>
                <div className={styles.actions}>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(key); }}>
                    {t('common.edit')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onCopy(key); }}>
                    {t('api_keys_page.copy')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(originalIndex); }}>
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
