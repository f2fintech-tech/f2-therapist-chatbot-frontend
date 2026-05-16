import React from 'react';

interface HookScreenProps {
  onStart: () => void;
  onDismiss: () => void;
}

export default function HookScreen({ onStart, onDismiss }: HookScreenProps) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.pill}>2 min · optional</span>
        <h2 style={styles.headline}>
          Most people think they know money. Let's find out where you actually stand.
        </h2>
        <p style={styles.subtext}>
          5 quick scenarios. No judgment — just insight. Your chat adapts to your result.
        </p>
      </div>

      <div style={styles.previewRow}>
        <div style={styles.previewCard}>
          <span style={styles.previewEmoji}>🌱</span>
          <strong>Seedling</strong>
        </div>
        <div style={styles.previewCard}>
          <span style={styles.previewEmoji}>📈</span>
          <strong>Grower</strong>
        </div>
        <div style={styles.previewCard}>
          <span style={styles.previewEmoji}>🏆</span>
          <strong>Investor</strong>
        </div>
      </div>

      <div style={styles.actions}>
        <button style={styles.primaryButton} onClick={onStart}>
          Discover my level →
        </button>
        <button style={styles.ghostButton} onClick={onDismiss}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f0ff',
    color: '#1a4db7',
    borderRadius: '999px',
    padding: '6px 12px',
    fontSize: '13px',
    fontWeight: 600,
  },
  headline: {
    margin: 0,
    fontSize: '24px',
    lineHeight: 1.2,
    color: '#111827',
  },
  subtext: {
    margin: 0,
    color: '#6b7280',
    fontSize: '15px',
    lineHeight: 1.6,
  },
  previewRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
  },
  previewCard: {
    padding: '18px',
    borderRadius: '18px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    textAlign: 'center' as const,
    opacity: 0.72,
    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.05)',
    minHeight: '120px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  previewEmoji: {
    fontSize: '28px',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  primaryButton: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
  },
  ghostButton: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '12px',
    border: '1px solid #d1d5db',
    backgroundColor: 'transparent',
    color: '#374151',
    fontWeight: 600,
    fontSize: '15px',
    cursor: 'pointer',
  }
};
