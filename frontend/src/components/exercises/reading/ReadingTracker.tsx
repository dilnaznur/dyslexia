/**
 * Reading Tracker Exercise
 * Evidence: Line tracking reduces skipping lines and improves comprehension
 * Source: Schneps et al. (2013). Reading and visual processing study
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { EXERCISE_CONTENT, getExerciseLanguage } from '@/data/exercises';
import RewardAnimation from '../RewardAnimation';
import { recordExerciseCompletion, UserProgress } from '@/lib/exerciseStorage';

interface ReadingTrackerProps {
  onBack: () => void;
  onComplete: (progress: UserProgress) => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';

type TrueFalseQuestion = { question: string; correct: boolean };

type ReadingPassage = {
  id: string;
  title: string;
  lines: string[];
  difficulty: Difficulty;
};

export default function ReadingTracker({ onBack, onComplete }: ReadingTrackerProps) {
  const { t, i18n } = useTranslation();
  const exerciseLang = getExerciseLanguage(i18n.language);
  const passages = EXERCISE_CONTENT.readingTracker[exerciseLang].passages as ReadingPassage[];
  const quizById = EXERCISE_CONTENT.readingTracker[exerciseLang].quiz as Record<string, TrueFalseQuestion[]>;
  const [gameState, setGameState] = useState<'intro' | 'reading' | 'quiz' | 'result' | 'reward'>('intro');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [passage, setPassage] = useState<ReadingPassage | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<boolean[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);

  // Quiz questions based on passage
  const getQuizQuestions = (passageId: string) => {
    return quizById[passageId] || [];
  };

  // Initialize the game
  const initializeGame = useCallback(() => {
    const selectedPassage = passages.find((p) => p.difficulty === difficulty);
    if (selectedPassage) {
      setPassage(selectedPassage);
      setCurrentLineIndex(0);
      setQuizAnswers([]);
      setCurrentQuizIndex(0);
      setScore(0);
      setGameState('reading');
    }
  }, [difficulty, passages]);

  // Handle line navigation
  const moveToNextLine = () => {
    if (passage && currentLineIndex < passage.lines.length - 1) {
      setCurrentLineIndex((i) => i + 1);
    } else {
      // Reading complete, move to quiz
      setGameState('quiz');
    }
  };

  const moveToPreviousLine = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex((i) => i - 1);
    }
  };

  // Handle quiz answer
  const handleQuizAnswer = (answer: boolean) => {
    if (!passage) return;

    const questions = getQuizQuestions(passage.id);
    const isCorrect = answer === questions[currentQuizIndex].correct;

    setQuizAnswers((prev) => [...prev, isCorrect]);
    if (isCorrect) {
      setScore((s) => s + 1);
    }

    if (currentQuizIndex < questions.length - 1) {
      setCurrentQuizIndex((i) => i + 1);
    } else {
      finishGame();
    }
  };

  // Finish the game
  const finishGame = () => {
    const questions = passage ? getQuizQuestions(passage.id) : [];
    const percentage = Math.round((score / Math.max(questions.length, 1)) * 100);
    let stars = 0;
    if (percentage >= 90) stars = 3;
    else if (percentage >= 60) stars = 2;
    else if (percentage >= 30) stars = 1;

    setEarnedStars(stars);
    setGameState('reward');
  };

  // Handle reward animation complete
  const handleRewardComplete = () => {
    const questions = passage ? getQuizQuestions(passage.id) : [];
    const progress = recordExerciseCompletion('reading-tracker', score, questions.length);
    setGameState('result');
    onComplete(progress);
  };

  const quizQuestions = passage ? getQuizQuestions(passage.id) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pale-yellow via-mint to-soft-blue p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-white mb-8 hover:bg-white/20 px-4 py-2 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {t('exerciseScreens.common.backToExercises')}
        </motion.button>

        <AnimatePresence mode="wait">
          {/* Intro Screen */}
          {gameState === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-8 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                📏
              </motion.div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">{t('exercises.reading-tracker.name', { defaultValue: 'Reading Tracker' })}</h1>
              <p className="text-text-secondary mb-6">
                {t('exerciseScreens.readingTracker.intro')}
              </p>

              {/* Story Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-text-primary mb-4">{t('exerciseScreens.readingTracker.chooseStory')}</h3>
                <div className="flex gap-4 justify-center flex-wrap">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
                    const p = passages.find((passage) => passage.difficulty === d);
                    return (
                      <motion.button
                        key={d}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDifficulty(d)}
                        className={`px-6 py-4 rounded-xl font-medium transition-all text-left ${
                          difficulty === d
                            ? 'bg-mint text-white shadow-lg'
                            : 'bg-white/50 text-text-primary hover:bg-white/70'
                        }`}
                      >
                        <span className="block capitalize text-lg">{d === 'easy' ? t('common.easy') : d === 'medium' ? t('common.medium') : t('common.hard')}</span>
                        <span className="text-sm opacity-80">{p?.title}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="bg-mint hover:bg-green-400 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg flex items-center gap-3 mx-auto"
              >
                <Play className="w-6 h-6" />
                {t('exerciseScreens.readingTracker.startReading')}
              </motion.button>
            </motion.div>
          )}

          {/* Reading Screen */}
          {gameState === 'reading' && passage && (
            <motion.div
              key="reading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              {/* Title */}
              <h2 className="text-2xl font-bold text-text-primary text-center mb-2">
                {passage.title}
              </h2>
              <p className="text-center text-text-secondary mb-6">
                {t('exerciseScreens.readingTracker.lineCounter', { current: currentLineIndex + 1, total: passage.lines.length })}
              </p>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
                <motion.div
                  className="h-full bg-mint"
                  animate={{ width: `${((currentLineIndex + 1) / passage.lines.length) * 100}%` }}
                />
              </div>

              {/* Reading Area */}
              <div className="bg-white/50 rounded-xl p-6 mb-8 min-h-64">
                {passage.lines.map((line, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0.3 }}
                    animate={{
                      opacity: index === currentLineIndex ? 1 : 0.3,
                      scale: index === currentLineIndex ? 1.02 : 1,
                      backgroundColor: index === currentLineIndex ? 'rgba(168, 230, 207, 0.3)' : 'transparent',
                    }}
                    className={`text-xl leading-loose py-2 px-4 rounded-lg transition-all ${
                      index === currentLineIndex ? 'text-text-primary font-medium' : 'text-text-secondary'
                    }`}
                  >
                    {line}
                  </motion.p>
                ))}
              </div>

              {/* Navigation Instructions */}
              <p className="text-center text-text-secondary mb-4">
                {t('exerciseScreens.readingTracker.navigationHint')}
              </p>

              {/* Navigation Buttons */}
              <div className="flex justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={moveToPreviousLine}
                  disabled={currentLineIndex === 0}
                  className={`p-4 rounded-full ${
                    currentLineIndex === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white/50 text-text-primary hover:bg-white/70'
                  }`}
                >
                  <ChevronUp className="w-8 h-8" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={moveToNextLine}
                  className="p-4 rounded-full bg-mint text-white hover:bg-green-400"
                >
                  {currentLineIndex < passage.lines.length - 1 ? (
                    <ChevronDown className="w-8 h-8" />
                  ) : (
                    <CheckCircle className="w-8 h-8" />
                  )}
                </motion.button>
              </div>

              {currentLineIndex === passage.lines.length - 1 && (
                <p className="text-center text-mint font-medium mt-4">
                  {t('exerciseScreens.readingTracker.quizHint')}
                </p>
              )}
            </motion.div>
          )}

          {/* Quiz Screen */}
          {gameState === 'quiz' && passage && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8 text-center"
            >
              <h2 className="text-2xl font-bold text-text-primary mb-2">{t('exerciseScreens.readingTracker.quickQuiz')}</h2>
              <p className="text-text-secondary mb-6">
                {t('exerciseScreens.readingTracker.questionCounter', { current: currentQuizIndex + 1, total: quizQuestions.length })}
              </p>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
                <motion.div
                  className="h-full bg-soft-blue"
                  animate={{ width: `${((currentQuizIndex + 1) / quizQuestions.length) * 100}%` }}
                />
              </div>

              {/* Question */}
              <div className="bg-white/50 rounded-xl p-6 mb-8">
                <p className="text-xl text-text-primary">
                  "{quizQuestions[currentQuizIndex]?.question}"
                </p>
              </div>

              <p className="text-text-secondary mb-6">{t('exerciseScreens.readingTracker.trueFalsePrompt')}</p>

              {/* Answer Buttons */}
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuizAnswer(true)}
                  className="bg-mint hover:bg-green-400 text-white font-bold py-4 px-12 rounded-full shadow-lg"
                >
                  {t('exerciseScreens.common.true')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuizAnswer(false)}
                  className="bg-red-400 hover:bg-red-500 text-white font-bold py-4 px-12 rounded-full shadow-lg"
                >
                  {t('exerciseScreens.common.false')}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Result Screen */}
          {gameState === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-8 text-center"
            >
              <h2 className="text-3xl font-bold text-text-primary mb-4">{t('exerciseScreens.readingTracker.resultTitle')}</h2>
              <div className="text-6xl font-bold text-mint mb-4">
                {score}/{quizQuestions.length}
              </div>
              <p className="text-text-secondary mb-8">
                {t('exerciseScreens.readingTracker.resultSummary', { score, total: quizQuestions.length })}
              </p>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={initializeGame}
                  className="bg-mint hover:bg-green-400 text-white font-bold py-3 px-8 rounded-full"
                >
                  {t('exerciseScreens.readingTracker.readAgain')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="bg-white/50 hover:bg-white/70 text-text-primary font-bold py-3 px-8 rounded-full"
                >
                  {t('exerciseScreens.common.backToHub')}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reward Animation */}
        {gameState === 'reward' && (
          <RewardAnimation
            type={earnedStars === 3 ? 'perfect' : 'stars'}
            stars={earnedStars}
            onComplete={handleRewardComplete}
          />
        )}
      </div>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px) saturate(180%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
        }
      `}</style>
    </div>
  );
}
