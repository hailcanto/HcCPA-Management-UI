import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { KeyMetadata } from '@/stores/useApiKeysStore';

interface ApiKeyEditModalProps {
  open: boolean;
  keyValue: string;
  metadata: KeyMetadata | undefined;
  onSave: (key: string, meta: KeyMetadata) => void;
  onClose: () => void;
}

const maskKey = (key: string) => {
  if (key.length <= 8) return '****';
  return key.slice(0, 6) + '****' + key.slice(-4);
};

export function ApiKeyEditModal({ open, keyValue, metadata, onSave, onClose }: ApiKeyEditModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState(metadata?.name || '');
  const [note, setNote] = useState(metadata?.note || '');

  const handleSave = () => {
    onSave(keyValue, { name: name.trim(), note: note.trim() || undefined });
    onClose();
  };

  return (
    <Modal open={open} title={t('api_keys_page.edit')} onClose={onClose}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '360px' }}>
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>
            {t('api_keys_page.key_value')}
          </label>
          <div style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {maskKey(keyValue)}
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>
            {t('api_keys_page.name')}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('api_keys_page.name_placeholder')}
            style={{
              width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)',
              borderRadius: '0.375rem', background: 'var(--input-bg)', color: 'var(--text-color)',
              fontSize: '0.875rem', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'block', marginBottom: '0.375rem' }}>
            {t('api_keys_page.note')}
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('api_keys_page.note_placeholder')}
            rows={3}
            style={{
              width: '100%', padding: '0.5rem 0.75rem', border: '1px solid var(--border-color)',
              borderRadius: '0.375rem', background: 'var(--input-bg)', color: 'var(--text-color)',
              fontSize: '0.875rem', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <Button variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleSave}>{t('common.save')}</Button>
        </div>
      </div>
    </Modal>
  );
}
