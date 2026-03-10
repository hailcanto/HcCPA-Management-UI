import { useTranslation } from 'react-i18next';
import styles from './MappingScopeTag.module.scss';

interface MappingScopeTagProps {
  scope: 'oauth' | 'ampcode';
  channel?: string;
}

export function MappingScopeTag({ scope, channel }: MappingScopeTagProps) {
  const { t } = useTranslation();

  return (
    <span className={styles.wrapper}>
      <span className={`${styles.tag} ${styles[scope]}`}>
        {t(`model_mappings_page.scope_${scope}`)}
      </span>
      {channel && <span className={styles.channel}>{channel}</span>}
    </span>
  );
}
