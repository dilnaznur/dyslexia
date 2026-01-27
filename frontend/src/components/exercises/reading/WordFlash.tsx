/**
 * Word Flash Exercise
 * Evidence: Rapid Automatized Naming (RAN) improves reading fluency
 * Source: Shaywitz, S. (2003). Overcoming Dyslexia
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle, XCircle, Zap } from 'lucide-react';
import { WORD_FLASH_WORDS } from '@/data/exercises';
import RewardAnimation from '../RewardAnimation';
import { recordExerciseCompletion, UserProgress } from '@/lib/exerciseStorage';

interface WordFlashProps {
  onBack: () => void;
  onComplete: (progress: UserProgress) => void;
}

type Difficulty = 'easy' | 'medium' | 'hard';

export default function WordFlash({ onBack, onComplete }: WordFlashProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result' | 'reward'>('intro');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showWord, setShowWord] = useState(false);
  const [words, setWords] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<'correct' | 'wrong' | null>(null);
  const [flashDuration, setFlashDuration] = useState(1500);
  const [earnedStars, setEarnedStars] = useState(0);

  // Initialize words for the round
  const initializeGame = useCallback(() => {
    const wordList = [...WORD_FLASH_WORDS[difficulty]];
    // Shuffle and take 10 words
    const shuffled = wordList.sort(() => Math.random() - 0.5).slice(0, 10);
    setWords(shuffled);
    setCurrentWordIndex(0);
    setScore(0);
    setAnswered(false);
    setLastResult(null);

    // Set flash duration based on difficulty
    const durations = { easy: 1500, medium: 1000, hard: 600 };
    setFlashDuration(durations[difficulty]);

    setGameState('playing');
  }, [difficulty]);

  // Show word sequence
  useEffect(() => {
    if (gameState !== 'playing' || answered) return;

    setShowWord(true);
    const hideTimer = setTimeout(() => {
      setShowWord(false);
    }, flashDuration);

    return () => clearTimeout(hideTimer);
  }, [gameState, currentWordIndex, flashDuration, answered]);

  // Handle user response
  const handleResponse = (sawWord: boolean) => {
    if (answered) return;

    setAnswered(true);
    // In this simple version, we assume they should click "Yes" if they recognized it
    const isCorrect = sawWord;
    setLastResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScore((s) => s + 1);
    }

    // Move to next word after delay
    setTimeout(() => {
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex((i) => i + 1);
        setAnswered(false);
        setLastResult(null);
      } else {
        finishGame();
      }
    }, 800);
  };

  // Finish the game
  const finishGame = () => {
    const percentage = Math.round((score / words.length) * 100);
    let stars = 0;
    if (percentage >= 90) stars = 3;
    else if (percentage >= 70) stars = 2;
    else if (percentage >= 50) stars = 1;

    setEarnedStars(stars);
    setGameState('reward');
  };

  // Handle reward animation complete
  const handleRewardComplete = () => {
    const progress = recordExerciseCompletion('word-flash', score, words.length);
    setGameState('result');
    onComplete(progress);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue via-mint to-pale-yellow p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="flex items-center gap-2 text-white mb-8 hover:bg-white/20 px-4 py-2 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Exercises
        </motion.button>

        {/* Intro Screen */}
        <AnimatePresence mode="wait">
          {gameState === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass-card p-8 text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                ⚡
              </motion.div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">Word Flash</h1>
              <p className="text-text-secondary mb-8">
                Words will flash on the screen. Click "I Saw It!" when you recognize the word!
              </p>

              {/* Difficulty Selection */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Choose Difficulty</h3>
                <div className="flex gap-4 justify-center">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <motion.button
                      key={d}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDifficulty(d)}
                      className={`px-6 py-3 rounded-full font-medium capitalize transition-all ${
                        difficulty === d
                          ? 'bg-soft-blue text-white shadow-lg'
                          : 'bg-white/50 text-text-primary hover:bg-white/70'
                      }`}
                    >
                      {d}
                    </motion.button>
                  ))}
                </div>
                <p className="text-sm text-text-secondary mt-2">
                  {difficulty === 'easy' && 'Simple words, slower flash (1.5s)'}
                  {difficulty === 'medium' && 'Longer words, medium flash (1s)'}
                  {difficulty === 'hard' && 'Complex words, fast flash (0.6s)'}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="bg-mint hover:bg-green-400 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg flex items-center gap-3 mx-auto"
              >
                <Play className="w-6 h-6" />
                Start Game
              </motion.button>
            </motion.div>
          )}

          {/* Playing Screen */}
          {gameState === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              {/* Progress */}
              <div className="flex justify-between items-center mb-8">
                <span className="text-text-secondary">
                  Word {currentWordIndex + 1} of {words.length}
                </span>
                <span className="text-text-primary font-bold">
                  Score: {score}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
                <motion.div
                  className="h-full bg-mint"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentWordIndex + 1) / words.length) * 100}%` }}
                />
              </div>

              {/* Word Display Area */}
              <div className="h-48 flex items-center justify-center mb-8 relative">
                <AnimatePresence mode="wait">
                  {showWord && !answered && (
                    <motion.div
                      key={currentWordIndex}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-5xl font-bold text-text-primary"
                    >
                      {words[currentWordIndex]}
                    </motion.div>
                  )}
                  {!showWord && !answered && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-text-secondary"
                    >
                      <Zap className="w-16 h-16 mx-auto mb-2 text-soft-blue" />
                      <p>Get ready...</p>
                    </motion.div>
                  )}
                  {lastResult && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      {lastResult === 'correct' ? (
                        <>
                          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-500">Correct!</p>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-20 h-20 text-red-500 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-red-500">Try Again!</p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Response Buttons */}
              {!answered && !showWord && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 justify-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleResponse(true)}
                    className="bg-mint hover:bg-green-400 text-white font-bold py-4 px-8 rounded-full shadow-lg"
                  >
                    I Saw It!
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleResponse(false)}
                    className="bg-white/50 hover:bg-white/70 text-text-primary font-bold py-4 px-8 rounded-full shadow-lg"
                  >
                    Missed It
                  </motion.button>
                </motion.div>
              )}
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
              <h2 className="text-3xl font-bold text-text-primary mb-4">Game Complete!</h2>
              <div className="text-6xl font-bold text-mint mb-4">
                {Math.round((score / words.length) * 100)}%
              </div>
              <p className="text-text-secondary mb-8">
                You recognized {score} out of {words.length} words!
              </p>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={initializeGame}
                  className="bg-soft-blue hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full"
                >
                  Play Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onBack}
                  className="bg-white/50 hover:bg-white/70 text-text-primary font-bold py-3 px-8 rounded-full"
                >
                  Back to Hub
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
