import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AutocompleteInput } from '@/components/ui/AutocompleteInput';
import { modelsApi } from '@/services/api/models';
import styles from './AddMappingModal.module.scss';

interface AddMappingModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    sourceName: string;
    targetModel: string;
    scope: 'oauth' | 'ampcode';
    channel: string;
    fork: boolean;
  }) => void;
  existingNames: string[];
}

const FALLBACK_MODELS = [
  'claude-sonnet-4-6',
  'claude-opus-4-6',
  'claude-haiku-4-5',
  'claude-3.5-sonnet',
  'claude-3.5-haiku',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gemini-2.0-flash',
  'gemini-2.0-pro',
  'gemini-1.5-pro',
  'o1',
  'o1-mini',
  'o3',
  'o3-mini',
  'o4-mini',
];

export function AddMappingModal({ open, onClose, onSave, existingNames }: AddMappingModalProps) {
  const { t } = useTranslation();
  const [sourceName, setSourceName] = useState('');
  const [targetModel, setTargetModel] = useState('');
  const [scope, setScope] = useState<'oauth' | 'ampcode'>('oauth');
  const [channel, setChannel] = useState('claude');
  const [fork, setFork] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>(FALLBACK_MODELS);

  // Fetch available models when modal opens
  useEffect(() => {
    if (!open) return;

    const fetchModels = async () => {
      try {
        const models = await modelsApi.fetchAllAvailableModels();
        if (models.length > 0) {
          setAvailableModels(models);
        }
      } catch (error) {
        console.error('Failed to fetch available models:', error);
        // Keep using fallback models
      }
    };

    fetchModels();
  }, [open]);

  const resetForm = useCallback(() => {
    setSourceName('');
    setTargetModel('');
    setScope('oauth');
    setChannel('claude');
    setFork(false);
    setShowAdvanced(false);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    resetForm();
  }, [onClose, resetForm]);

  const isDuplicate = useMemo(() => {
    const trimmed = sourceName.trim().toLowerCase();
    return trimmed !== '' && existingNames.some((n) => n.toLowerCase() === trimmed);
  }, [sourceName, existingNames]);

  const canSave = sourceName.trim() !== '' && targetModel.trim() !== '' && !isDuplicate;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    onSave({
      sourceName: sourceName.trim(),
      targetModel: targetModel.trim(),
      scope,
      channel: channel.trim() || 'claude',
      fork,
    });
    resetForm();
  }, [canSave, sourceName, targetModel, scope, channel, fork, onSave, resetForm]);

  return (
    <Modal
      open={open}
      title={t('model_mappings_page.add')}
      onClose={handleClose}
    >
      <div className={styles.form}>
        <label className={styles.formField}>
          <span>{t('model_mappings_page.source_name')}</span>
          <input
            type="text"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder={t('model_mappings_page.source_name_placeholder')}
            className={`${styles.input} ${isDuplicate ? styles.inputError : ''}`}
          />
          {isDuplicate && (
            <small className={styles.errorHint}>
              {t('model_mappings_page.source_name')} "{sourceName.trim()}" {t('common.already_exists', { defaultValue: 'already exists' })}
            </small>
          )}
        </label>
        <div className={styles.formField}>
          <span className={styles.fieldLabel}>{t('model_mappings_page.target_model')}</span>
          <AutocompleteInput
            value={targetModel}
            onChange={setTargetModel}
          options={availableModels}
            placeholder={t('model_mappings_page.target_model_placeholder')}
          />
        </div>
        <label className={styles.formField}>
          <span>{t('model_mappings_page.scope')}</span>
          <div className={styles.scopeSelector}>
            <button
              className={`${styles.scopeOption} ${scope === 'oauth' ? styles.active : ''}`}
              onClick={() => setScope('oauth')}
              type="button"
            >
              OAuth
            </button>
            <button
              className={`${styles.scopeOption} ${scope === 'ampcode' ? styles.active : ''}`}
              onClick={() => setScope('ampcode')}
              type="button"
            >
              Ampcode
            </button>
          </div>
        </label>
        {scope === 'oauth' && (
          <label className={styles.formField}>
            <span>{t('model_mappings_page.channel')}</span>
            <input
              type="text"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
              placeholder={t('model_mappings_page.channel_placeholder')}
              className={styles.input}
            />
          </label>
        )}
        <button
          className={styles.advancedToggle}
          onClick={() => setShowAdvanced(!showAdvanced)}
          type="button"
        >
          {t('model_mappings_page.advanced')} {showAdvanced ? '\u25B2' : '\u25BC'}
        </button>
        {showAdvanced && scope === 'oauth' && (
          <label className={styles.checkboxField}>
            <input
              type="checkbox"
              checked={fork}
              onChange={(e) => setFork(e.target.checked)}
            />
            <span>{t('model_mappings_page.fork')}</span>
            <small>{t('model_mappings_page.fork_description')}</small>
          </label>
        )}
        <div className={styles.formActions}>
          <Button variant="ghost" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {t('common.add')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
