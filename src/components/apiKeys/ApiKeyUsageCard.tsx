import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import type { APIKeyUsageSnapshot } from '@/stores/useApiKeysStore';
import styles from './ApiKeyUsageCard.module.scss';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface ApiKeyUsageCardProps {
  usage: APIKeyUsageSnapshot | null;
  loading: boolean;
}

const CHART_COLORS = [
  'rgba(59, 130, 246, 0.7)',
  'rgba(16, 185, 129, 0.7)',
  'rgba(245, 158, 11, 0.7)',
  'rgba(239, 68, 68, 0.7)',
  'rgba(139, 92, 246, 0.7)',
  'rgba(236, 72, 153, 0.7)',
  'rgba(20, 184, 166, 0.7)',
  'rgba(251, 146, 60, 0.7)',
];

export function ApiKeyUsageCard({ usage, loading }: ApiKeyUsageCardProps) {
  const { t } = useTranslation();

  const modelChartData = useMemo(() => {
    if (!usage?.models) return null;
    const entries = Object.entries(usage.models);
    if (entries.length === 0) return null;

    return {
      bar: {
        labels: entries.map(([name]) => name),
        datasets: [
          {
            label: t('api_keys_page.total_requests'),
            data: entries.map(([, s]) => s.total_requests),
            backgroundColor: CHART_COLORS.slice(0, entries.length),
            borderRadius: 4,
          },
        ],
      },
      doughnut: {
        labels: entries.map(([name]) => name),
        datasets: [
          {
            data: entries.map(([, s]) => s.total_tokens),
            backgroundColor: CHART_COLORS.slice(0, entries.length),
            borderWidth: 0,
          },
        ],
      },
    };
  }, [usage, t]);

  return (
    <Card className={styles.card}>
      <h3>{t('api_keys_page.usage')}</h3>
      {loading ? (
        <LoadingSpinner />
      ) : !usage ? (
        <p className={styles.noData}>{t('api_keys_page.no_usage')}</p>
      ) : (
        <>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('api_keys_page.total_requests')}</span>
              <span className={styles.statValue}>{usage.total_requests.toLocaleString()}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('api_keys_page.total_tokens')}</span>
              <span className={styles.statValue}>{usage.total_tokens.toLocaleString()}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>{t('api_keys_page.models_used')}</span>
              <span className={styles.statValue}>{Object.keys(usage.models).length}</span>
            </div>
          </div>

          {modelChartData && (
            <div className={styles.charts}>
              <div className={styles.chartBlock}>
                <h4>{t('api_keys_page.by_model')}</h4>
                <div className={styles.chartWrapper}>
                  <Bar
                    data={modelChartData.bar}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false } },
                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' } },
                      },
                    }}
                  />
                </div>
              </div>
              <div className={styles.chartBlock}>
                <h4>{t('api_keys_page.tokens_chart')}</h4>
                <div className={styles.doughnutWrapper}>
                  <Doughnut
                    data={modelChartData.doughnut}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 8, font: { size: 11 } } },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
