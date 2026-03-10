import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { authFilesApi } from '@/services/api';
import styles from './ApiKeyBindingCard.module.scss';

interface ApiKeyBindingCardProps {
  keyValue: string;
  boundAuthFiles: string[];
  allowedModels: string[];
  onSave: (authFiles: string[], models: string[]) => void | Promise<void>;
}

export function ApiKeyBindingCard({ keyValue, boundAuthFiles, allowedModels, onSave }: ApiKeyBindingCardProps) {
  const { t } = useTranslation();
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>(boundAuthFiles);
  const [models, setModels] = useState<string>(allowedModels.join(', '));
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    authFilesApi.list().then((res) => {
      const files = (res as { files?: { name: string }[] })?.files;
      if (Array.isArray(files)) {
        setAvailableFiles(files.map((f) => f.name));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setSelectedFiles(boundAuthFiles);
    setModels(allowedModels.join(', '));
    setDirty(false);
  }, [keyValue, boundAuthFiles, allowedModels]);

  const toggleFile = useCallback((file: string) => {
    setSelectedFiles((prev) =>
      prev.includes(file) ? prev.filter((f) => f !== file) : [...prev, file]
    );
    setDirty(true);
  }, []);

  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    const parsedModels = models.split(',').map((m) => m.trim()).filter(Boolean);
    setSaving(true);
    try {
      await onSave(selectedFiles, parsedModels);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  }, [selectedFiles, models, onSave]);

  return (
    <Card className={styles.card}>
      <h3>{t('api_keys_page.binding')}</h3>
      <p className={styles.description}>{t('api_keys_page.binding_description')}</p>

      <div className={styles.section}>
        <label className={styles.label}>{t('api_keys_page.auth_files')}</label>
        {availableFiles.length === 0 ? (
          <p className={styles.hint}>{t('api_keys_page.auth_files_all')}</p>
        ) : (
          <div className={styles.fileList}>
            {availableFiles.map((file) => (
              <label key={file} className={styles.fileItem}>
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file)}
                  onChange={() => toggleFile(file)}
                />
                <span>{file}</span>
              </label>
            ))}
          </div>
        )}
        {selectedFiles.length === 0 && availableFiles.length > 0 && (
          <p className={styles.hint}>{t('api_keys_page.auth_files_all')}</p>
        )}
      </div>

      <div className={styles.section}>
        <label className={styles.label}>{t('api_keys_page.allowed_models')}</label>
        <input
          type="text"
          value={models}
          onChange={(e) => { setModels(e.target.value); setDirty(true); }}
          placeholder={t('api_keys_page.allowed_models_all')}
          className={styles.input}
        />
        <p className={styles.hint}>
          {models.trim() ? '' : t('api_keys_page.allowed_models_all')}
        </p>
      </div>

      {dirty && (
        <div className={styles.actions}>
          <Button size="sm" onClick={handleSave} loading={saving}>{t('api_keys_page.save_binding')}</Button>
        </div>
      )}
    </Card>
  );
}
