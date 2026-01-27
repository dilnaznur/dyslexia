/**
 * Odd One Out Exercise
 * Evidence: Visual discrimination improves letter recognition
 * Source: Stein, J. (2001). Visual processing and dyslexia
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle, XCircle } from 'lucide-react';
import { ODD_ONE_OUT_ROUNDS } from '@/data/exercises';
import RewardAnimation from '../RewardAnimation';
import { recordExerciseCompletion, UserProgress } from '@/lib/exerciseStorage';

interface OddOneOutProps {
  onBack: () => void;
  onComplete: (progress: UserProgress) => void;
}

export default function OddOneOut({ onBack, onComplete }: OddOneOutProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'feedback' | 'result' | 'reward'>('intro');
  const [rounds, setRounds] = useState<typeof ODD_ONE_OUT_ROUNDS>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);

  const currentRound = rounds[currentRoundIndex];

  // Initialize the game
  const initializeGame = useCallback(() => {
    const shuffled = [...ODD_ONE_OUT_ROUNDS].sort(() => Math.random() - 0.5).slice(0, 10);
    setRounds(shuffled);
    setCurrentRoundIndex(0);
    setSelectedIndex(null);
    setScore(0);
    setGameState('playing');
  }, []);

  // Handle word selection
  const handleWordClick = (index: number) => {
    if (gameState !== 'playing' || selectedIndex !== null) return;

    setSelectedIndex(index);
    const correct = index === currentRound.answer;
    setIsCorrect(correct);

    if (correct) {
      setScore((s) => s + 1);
    }

    setGameState('feedback');

    // Move to next round after delay
    setTimeout(() => {
      if (currentRoundIndex < rounds.length - 1) {
        setCurrentRoundIndex((i) => i + 1);
        setSelectedIndex(null);
        setGameState('playing');
      } else {
        finishGame();
      }
    }, 1500);
  };

  // Finish the game
  const finishGame = () => {
    const percentage = Math.round((score / rounds.length) * 100);
    let stars = 0;
    if (percentage >= 90) stars = 3;
    else if (percentage >= 70) stars = 2;
    else if (percentage >= 50) stars = 1;

    setEarnedStars(stars);
    setGameState('reward');
  };

  // Handle reward animation complete
  const handleRewardComplete = () => {
    const progress = recordExerciseCompletion('odd-one-out', score, rounds.length);
    setGameState('result');
    onComplete(progress);
  };

  // Get card state
  const getCardState = (index: number): 'normal' | 'correct' | 'wrong' | 'missed' => {
    if (selectedIndex === null) return 'normal';
    if (index === selectedIndex) {
      return isCorrect ? 'correct' : 'wrong';
    }
    if (index === currentRound?.answer && !isCorrect) {
      return 'missed';
    }
    return 'normal';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pale-yellow via-peach to-lavender p-8">
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
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🔎
              </motion.div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">Odd One Out</h1>
              <p className="text-text-secondary mb-6">
                Find the word that's different from the others!
              </p>

              <div className="bg-white/30 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-text-primary mb-4">Example:</h3>
                <div className="grid grid-cols-4 gap-2 max-w-md mx-auto mb-4">
                  <div className="py-3 px-4 bg-white rounded-lg text-xl font-bold text-text-primary">cat</div>
                  <div className="py-3 px-4 bg-white rounded-lg text-xl font-bold text-text-primary">cat</div>
                  <div className="py-3 px-4 bg-mint rounded-lg text-xl font-bold text-white">bat</div>
                  <div className="py-3 px-4 bg-white rounded-lg text-xl font-bold text-text-primary">cat</div>
                </div>
                <p className="text-sm text-text-secondary">
                  Look carefully - one word is slightly different!
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="bg-peach hover:bg-orange-300 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg flex items-center gap-3 mx-auto"
              >
                <Play className="w-6 h-6" />
                Start Game
              </motion.button>
            </motion.div>
          )}

          {/* Playing/Feedback Screen */}
          {['playing', 'feedback'].includes(gameState) && currentRound && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              {/* Progress */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-text-secondary">
                  Round {currentRoundIndex + 1} of {rounds.length}
                </span>
                <span className="text-text-primary font-bold">
                  Score: {score}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
                <motion.div
                  className="h-full bg-peach"
                  animate={{ width: `${((currentRoundIndex + 1) / rounds.length) * 100}%` }}
                />
              </div>

              {/* Instruction */}
              <p className="text-center text-text-primary text-xl mb-8">
                Which word is different?
              </p>

              {/* Word Cards */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-8">
                {currentRound.words.map((word, index) => {
                  const state = getCardState(index);
                  return (
                    <motion.button
                      key={index}
                      whileHover={selectedIndex === null ? { scale: 1.05 } : {}}
                      whileTap={selectedIndex === null ? { scale: 0.95 } : {}}
                      onClick={() => handleWordClick(index)}
                      disabled={selectedIndex !== null}
                      className={`p-6 rounded-2xl text-2xl font-bold transition-all shadow-lg ${
                        state === 'correct'
                          ? 'bg-green-400 text-white'
                          : state === 'wrong'
                          ? 'bg-red-400 text-white'
                          : state === 'missed'
                          ? 'bg-yellow-400 text-white ring-4 ring-yellow-200'
                          : 'bg-white text-text-primary hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {word}
                        {state === 'correct' && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <CheckCircle className="w-6 h-6" />
                          </motion.span>
                        )}
                        {state === 'wrong' && (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <XCircle className="w-6 h-6" />
                          </motion.span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Feedback */}
              {gameState === 'feedback' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  {isCorrect ? (
                    <p className="text-xl font-bold text-green-500">Correct! Well spotted!</p>
                  ) : (
                    <p className="text-xl font-bold text-red-500">
                      Not quite! The answer was "{currentRound.words[currentRound.answer]}"
                    </p>
                  )}
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
              <div className="text-6xl font-bold text-peach mb-4">
                {Math.round((score / rounds.length) * 100)}%
              </div>
              <p className="text-text-secondary mb-8">
                You found {score} out of {rounds.length} odd words!
              </p>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={initializeGame}
                  className="bg-peach hover:bg-orange-300 text-white font-bold py-3 px-8 rounded-full"
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
