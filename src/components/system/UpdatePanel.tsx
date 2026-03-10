import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUpdateStore } from '@/stores/useUpdateStore';
import styles from './UpdatePanel.module.scss';

export function UpdatePanel() {
  const { t } = useTranslation();
  const {
    currentVersion, latestVersion, status, progress, error, serviceAvailable,
    checkForUpdate, startUpdate, reset,
  } = useUpdateStore();

  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return (
    <Card className={styles.panel}>
      <h3 className={styles.title}>{t('update_panel.title')}</h3>

      <div className={styles.versionInfo}>
        <div className={styles.versionRow}>
          <span className={styles.label}>{t('update_panel.current_version')}</span>
          <span className={styles.value}>{currentVersion || '-'}</span>
        </div>
        {latestVersion && (
          <div className={styles.versionRow}>
            <span className={styles.label}>{t('update_panel.latest_version')}</span>
            <span className={styles.value}>{latestVersion}</span>
          </div>
        )}
      </div>

      {status === 'error' && (
        <div className={styles.error}>
          {!serviceAvailable ? t('update_panel.service_unavailable') : error}
        </div>
      )}

      {status === 'available' && latestVersion && (
        <div className={styles.updateAvailable}>
          {t('update_panel.new_version', { version: latestVersion })}
        </div>
      )}

      {status === 'updating' && (
        <div className={styles.progress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} />
          </div>
          <span>{progress}</span>
        </div>
      )}

      {status === 'success' && (
        <div className={styles.success}>
          {t('update_panel.update_success')}
          <p className={styles.hint}>{t('update_panel.restart_hint')}</p>
        </div>
      )}

      {status === 'idle' && !error && serviceAvailable && (
        <div className={styles.upToDate}>{t('update_panel.up_to_date')}</div>
      )}

      <div className={styles.actions}>
        <Button
          variant="ghost"
          size="sm"
          onClick={checkForUpdate}
          loading={status === 'checking'}
          disabled={status === 'updating'}
        >
          {t('update_panel.check')}
        </Button>
        {status === 'available' && (
          <Button size="sm" onClick={startUpdate}>
            {t('update_panel.update_now')}
          </Button>
        )}
        {(status === 'success' || status === 'error') && (
          <Button variant="ghost" size="sm" onClick={reset}>
            {t('common.close')}
          </Button>
        )}
      </div>
    </Card>
  );
}
