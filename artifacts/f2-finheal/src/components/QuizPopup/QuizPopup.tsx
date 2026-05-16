import React, { useEffect, useMemo, useState } from 'react';
import HookScreen from './HookScreen';
import QuizScreen from './QuizScreen';
import ResultScreen from './ResultScreen';
import { useQuizState } from './useQuizState';
import { quizQuestions } from './questions';

interface QuizPopupProps {
  visible: boolean;
  onDismiss: () => void;
  onComplete: (tierName: string, score: number) => void;
}

export default function QuizPopup({ visible, onDismiss, onComplete }: QuizPopupProps) {
  const [screen, setScreen] = useState<'hook' | 'quiz' | 'result'>('hook');
  const [showNextButton, setShowNextButton] = useState(false);
  const [timer, setTimer] = useState(0);
  const {
    currentQuestionIndex,
    score,
    hasAnswered,
    selectedAnswerIndex,
    timings,
    startQuiz,
    selectAnswer,
    goToNextQuestion,
    resetQuiz,
  } = useQuizState();

  useEffect(() => {
    if (screen === 'quiz') {
      setTimer(0);
      setShowNextButton(false);
    }
  }, [screen, currentQuestionIndex]);

  useEffect(() => {
    if (!visible) {
      setScreen('hook');
      resetQuiz();
      setShowNextButton(false);
      setTimer(0);
    }
  }, [visible, resetQuiz]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss();
      }
    };
    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onDismiss]);

  useEffect(() => {
    if (!visible || screen !== 'quiz' || hasAnswered) {
      return undefined;
    }

    const interval = window.setInterval(() => {
      setTimer((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [visible, screen, hasAnswered]);

  const elapsedSeconds = useMemo(() => {
    if (screen !== 'quiz') {
      return 0;
    }
    return timer;
  }, [screen, timer]);

  const handleStart = () => {
    startQuiz();
    setScreen('quiz');
    setShowNextButton(false);
    setTimer(0);
  };

  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered) {
      return;
    }
    selectAnswer(answerIndex, timer);
    setShowNextButton(false);
    window.setTimeout(() => {
      setShowNextButton(true);
    }, 800);
  };

  const handleNext = () => {
    if (currentQuestionIndex === quizQuestions.length - 1) {
      setScreen('result');
      return;
    }
    goToNextQuestion();
    setShowNextButton(false);
    setTimer(0);
  };

  const handleComplete = (tierName: string, score: number) => {
    onComplete(tierName, score);
  };

  const handleBackdropClick = () => {
    onDismiss();
  };

  if (!visible) {
    return null;
  }

  return (
    <div style={styles.overlay} onClick={handleBackdropClick}>
      <div style={styles.modal} onClick={(event) => event.stopPropagation()}>
        {screen === 'hook' && <HookScreen onStart={handleStart} onDismiss={onDismiss} />}
        {screen === 'quiz' && (
          <QuizScreen
            currentQuestionIndex={currentQuestionIndex}
            selectedAnswerIndex={selectedAnswerIndex}
            hasAnswered={hasAnswered}
            onAnswer={handleAnswer}
            onNext={handleNext}
            showNextButton={showNextButton}
            elapsedSeconds={elapsedSeconds}
          />
        )}
        {screen === 'result' && (
          <ResultScreen score={score} timings={timings} onComplete={handleComplete} />
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000,
  },
  modal: {
    width: '100%',
    maxWidth: '700px',
    backgroundColor: '#ffffff',
    borderRadius: '28px',
    padding: '28px',
    boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxHeight: '94vh',
    overflowY: 'auto' as const,
  },
};
