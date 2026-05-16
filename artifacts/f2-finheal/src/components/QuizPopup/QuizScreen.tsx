import React from 'react';
import { quizQuestions } from './questions';

interface QuizScreenProps {
  currentQuestionIndex: number;
  selectedAnswerIndex: number | null;
  hasAnswered: boolean;
  onAnswer: (answerIndex: number) => void;
  onNext: () => void;
  showNextButton: boolean;
  elapsedSeconds: number;
}

export default function QuizScreen({
  currentQuestionIndex,
  selectedAnswerIndex,
  hasAnswered,
  onAnswer,
  onNext,
  showNextButton,
  elapsedSeconds,
}: QuizScreenProps) {
  const question = quizQuestions[currentQuestionIndex];
  const isLast = currentQuestionIndex === quizQuestions.length - 1;

  return (
    <div style={styles.container}>
      <div style={styles.progressRow}>
        <div style={styles.progressInfo}>
          <div style={styles.progressText}>Question {currentQuestionIndex + 1} of {quizQuestions.length}</div>
          <div style={styles.progressBarBackground}>
            <div style={{ ...styles.progressBarFill, width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }} />
          </div>
        </div>
        <div style={styles.timerPill}>⏱️ {elapsedSeconds}s</div>
      </div>

      <div style={styles.categoryRow}>
        <span style={styles.categoryChip}>{question.emoji} {question.category}</span>
      </div>

      <div style={styles.scenarioCard}>
        <p style={styles.scenarioText}>{question.scenario}</p>
      </div>

      <div style={styles.optionsGrid}>
        {question.options.map((option, index) => {
          const isCorrect = index === question.correctAnswerIndex;
          const isSelected = index === selectedAnswerIndex;
          const status = hasAnswered
            ? isCorrect
              ? 'correct'
              : isSelected
                ? 'wrong'
                : 'neutral'
            : 'neutral';

          return (
            <button
              key={option}
              style={{ ...styles.optionButton, ...styles.optionStatus[status] }}
              onClick={() => onAnswer(index)}
              disabled={hasAnswered}
            >
              <span>{option}</span>
              {hasAnswered && isCorrect && <span style={styles.optionIcon}>✓</span>}
              {hasAnswered && isSelected && !isCorrect && <span style={styles.optionIcon}>✕</span>}
            </button>
          );
        })}
      </div>

      {hasAnswered && (
        <div style={styles.microTipContainer}>
          <p style={styles.microTip}>{question.microTip}</p>
        </div>
      )}

      {showNextButton && (
        <button style={styles.nextButton} onClick={onNext}>
          {isLast ? 'See my result →' : 'Next →'}
        </button>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  progressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  progressInfo: {
    flex: 1,
    minWidth: '180px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressText: {
    color: '#374151',
    fontSize: '14px',
    fontWeight: 600,
  },
  progressBarBackground: {
    width: '100%',
    height: '8px',
    borderRadius: '999px',
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '999px',
    backgroundColor: '#2563eb',
    transition: 'width 300ms ease',
  },
  timerPill: {
    padding: '6px 12px',
    borderRadius: '999px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    fontSize: '13px',
    minWidth: '96px',
    textAlign: 'center' as const,
  },
  categoryRow: {
    display: 'flex',
  },
  categoryChip: {
    padding: '8px 14px',
    borderRadius: '999px',
    backgroundColor: '#eef2ff',
    color: '#3730a3',
    fontWeight: 600,
    fontSize: '13px',
  },
  scenarioCard: {
    padding: '18px',
    backgroundColor: '#ffffff',
    borderRadius: '18px',
    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.06)',
  },
  scenarioText: {
    margin: 0,
    color: '#111827',
    fontSize: '16px',
    lineHeight: 1.7,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px',
  },
  optionButton: {
    minHeight: '78px',
    padding: '16px',
    borderRadius: '16px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: '14px',
    fontWeight: 600,
    textAlign: 'left' as const,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 180ms ease, border-color 180ms ease',
  },
  optionStatus: {
    neutral: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
    },
    correct: {
      backgroundColor: '#dcfce7',
      borderColor: '#22c55e',
      color: '#166534',
    },
    wrong: {
      backgroundColor: '#fee2e2',
      borderColor: '#ef4444',
      color: '#991b1b',
    },
  },
  optionIcon: {
    marginLeft: '10px',
    fontSize: '18px',
  },
  microTipContainer: {
    padding: '14px 18px',
    borderRadius: '16px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
  },
  microTip: {
    margin: 0,
    color: '#6b7280',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  nextButton: {
    marginTop: '4px',
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
