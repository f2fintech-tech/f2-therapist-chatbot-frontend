import { useCallback, useState } from 'react';
import { quizQuestions } from './questions';

export interface QuizState {
  currentQuestionIndex: number;
  score: number;
  hasAnswered: boolean;
  selectedAnswerIndex: number | null;
  timings: number[];
}

export interface QuizActions {
  startQuiz: () => void;
  selectAnswer: (answerIndex: number, secondsElapsed: number) => void;
  goToNextQuestion: () => void;
  resetQuiz: () => void;
}

export function useQuizState(): QuizState & QuizActions {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [timings, setTimings] = useState<number[]>([]);

  const startQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setHasAnswered(false);
    setSelectedAnswerIndex(null);
    setTimings([]);
  }, []);

  const selectAnswer = useCallback(
    (answerIndex: number, secondsElapsed: number) => {
      if (hasAnswered) {
        return;
      }

      setHasAnswered(true);
      setSelectedAnswerIndex(answerIndex);
      setTimings((prev) => [...prev, Math.max(0, Math.round(secondsElapsed))]);

      if (answerIndex === quizQuestions[currentQuestionIndex].correctAnswerIndex) {
        setScore((prev) => prev + 1);
      }
    },
    [currentQuestionIndex, hasAnswered]
  );

  const goToNextQuestion = useCallback(() => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, quizQuestions.length - 1));
    setHasAnswered(false);
    setSelectedAnswerIndex(null);
  }, []);

  const resetQuiz = useCallback(() => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setHasAnswered(false);
    setSelectedAnswerIndex(null);
    setTimings([]);
  }, []);

  return {
    currentQuestionIndex,
    score,
    hasAnswered,
    selectedAnswerIndex,
    timings,
    startQuiz,
    selectAnswer,
    goToNextQuestion,
    resetQuiz,
  };
}
