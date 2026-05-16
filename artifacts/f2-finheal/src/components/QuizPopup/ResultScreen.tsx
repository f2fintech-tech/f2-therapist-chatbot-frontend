import React from 'react';

interface ResultScreenProps {
  score: number;
  timings: number[];
  onComplete: (tierName: string, score: number) => void;
}

const tierConfig = [
  { min: 0, max: 1, name: 'Seedling', emoji: '🌱', color: '#16a34a', quote: 'Every expert was once a beginner. You just took the first honest step most people never do.' },
  { min: 2, max: 3, name: 'Grower', emoji: '📈', color: '#d97706', quote: 'You know enough to be dangerous — in the best way. Now let’s sharpen that instinct into a strategy.' },
  { min: 4, max: 5, name: 'Investor', emoji: '🏆', color: '#7c3aed', quote: 'You think in systems, not just numbers. That’s what separates wealth builders from earners.' },
];

const speedLabel = (averageSeconds: number) => {
  if (averageSeconds < 10) {
    return { label: '⚡ Sharp', color: '#059669' };
  }
  if (averageSeconds <= 20) {
    return { label: '🎯 Thoughtful', color: '#c2410c' };
  }
  return { label: '🔍 Careful', color: '#4b5563' };
};

function getTier(score: number) {
  return tierConfig.find((tier) => score >= tier.min && score <= tier.max) ?? tierConfig[0];
}

export default function ResultScreen({ score, timings, onComplete }: ResultScreenProps) {
  const averageSeconds = timings.length > 0 ? Math.round(timings.reduce((sum, t) => sum + t, 0) / timings.length) : 0;
  const tier = getTier(score);
  const speed = speedLabel(averageSeconds);

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes tierBounce {
          0% { transform: scale(0.85); opacity: 0.5; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={styles.emojiArea}>
        <span style={{ ...styles.emoji, color: tier.color }}>{tier.emoji}</span>
      </div>
      <div style={styles.tierName(tier.color)}>{tier.name}</div>

      <div style={styles.pillRow}>
        <span style={styles.scorePill}>Score: {score}/5</span>
        <span style={{ ...styles.speedPill, backgroundColor: '#f3f4f6', color: speed.color }}>{speed.label}</span>
      </div>

      <blockquote style={styles.quote}>{tier.quote}</blockquote>
      <p style={styles.subtitle}>Your FinHeal chat is now personalised for a {tier.name}.</p>

      <button style={styles.button} onClick={() => onComplete(tier.name, score)}>
        Start my personalised chat →
      </button>
    </div>
  );
}

const styles: Record<string, any> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  emojiArea: {
    display: 'flex',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: '72px',
    animation: 'tierBounce 0.5s ease-out',
  },
  tierName: (color: string) => ({
    fontSize: '28px',
    fontWeight: 700,
    color,
    textAlign: 'center' as const,
  }),
  pillRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    justifyContent: 'center',
  },
  scorePill: {
    padding: '10px 16px',
    borderRadius: '999px',
    backgroundColor: '#e0f2fe',
    color: '#0c4a6e',
    fontWeight: 700,
  },
  speedPill: {
    padding: '10px 16px',
    borderRadius: '999px',
    fontWeight: 700,
  },
  quote: {
    margin: 0,
    paddingLeft: '16px',
    borderLeft: '4px solid #d1d5db',
    color: '#4b5563',
    fontSize: '16px',
    lineHeight: 1.75,
  },
  subtitle: {
    margin: 0,
    color: '#4b5563',
    fontSize: '15px',
    textAlign: 'center' as const,
  },
  button: {
    width: '100%',
    padding: '14px 18px',
    borderRadius: '14px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '15px',
    cursor: 'pointer',
  },
};
