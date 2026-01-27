/**
 * Mirror Letter Detective Exercise
 * Evidence: Visual discrimination training helps reduce letter reversals
 * Source: Fischer & Luxemburg (2020). Letter reversal interventions
 */
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Clock, CheckCircle, XCircle } from 'lucide-react';
import { MIRROR_GRIDS } from '@/data/exercises';
import RewardAnimation from '../RewardAnimation';
import { recordExerciseCompletion, UserProgress } from '@/lib/exerciseStorage';

interface MirrorDetectiveProps {
  onBack: () => void;
  onComplete: (progress: UserProgress) => void;
}

export default function MirrorDetective({ onBack, onComplete }: MirrorDetectiveProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'levelComplete' | 'result' | 'reward'>('intro');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [foundPositions, setFoundPositions] = useState<string[]>([]);
  const [wrongClicks, setWrongClicks] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [totalMirrors, setTotalMirrors] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);

  const currentGrid = MIRROR_GRIDS[currentLevel];

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - check if found all mirrors
          checkLevelComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Initialize the game
  const initializeGame = useCallback(() => {
    setCurrentLevel(0);
    setFoundPositions([]);
    setWrongClicks([]);
    setTimeLeft(30);
    setScore(0);
    setTotalMirrors(MIRROR_GRIDS.reduce((sum, grid) => sum + grid.mirrorPositions.length, 0));
    setGameState('playing');
  }, []);

  // Start next level
  const startNextLevel = () => {
    setFoundPositions([]);
    setWrongClicks([]);
    setTimeLeft(30);
    setGameState('playing');
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (gameState !== 'playing') return;

    const posKey = `${row}-${col}`;

    // Already clicked this cell
    if (foundPositions.includes(posKey) || wrongClicks.includes(posKey)) return;

    // Check if this is a mirror letter position
    const isMirror = currentGrid.mirrorPositions.some(
      ([r, c]) => r === row && c === col
    );

    if (isMirror) {
      setFoundPositions((prev) => [...prev, posKey]);
      setScore((s) => s + 1);

      // Check if found all mirrors in this level
      if (foundPositions.length + 1 === currentGrid.mirrorPositions.length) {
        checkLevelComplete();
      }
    } else {
      setWrongClicks((prev) => [...prev, posKey]);
    }
  };

  // Check level completion
  const checkLevelComplete = () => {
    if (currentLevel < MIRROR_GRIDS.length - 1) {
      setCurrentLevel((l) => l + 1);
      setGameState('levelComplete');
    } else {
      finishGame();
    }
  };

  // Finish the game
  const finishGame = () => {
    const percentage = Math.round((score / totalMirrors) * 100);
    let stars = 0;
    if (percentage >= 90) stars = 3;
    else if (percentage >= 70) stars = 2;
    else if (percentage >= 50) stars = 1;

    setEarnedStars(stars);
    setGameState('reward');
  };

  // Handle reward animation complete
  const handleRewardComplete = () => {
    const progress = recordExerciseCompletion('mirror-detective', score, totalMirrors);
    setGameState('result');
    onComplete(progress);
  };

  // Get cell state
  const getCellState = (row: number, col: number): 'found' | 'wrong' | 'normal' => {
    const posKey = `${row}-${col}`;
    if (foundPositions.includes(posKey)) return 'found';
    if (wrongClicks.includes(posKey)) return 'wrong';
    return 'normal';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue via-lavender to-peach p-8">
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
                🔍
              </motion.div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">Mirror Detective</h1>
              <p className="text-text-secondary mb-6">
                Find all the backwards (mirror) letters hiding in the grid!
              </p>

              <div className="bg-white/30 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-text-primary mb-4">How to Play:</h3>
                <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto mb-4">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl font-bold text-text-primary">b</div>
                  <div className="w-12 h-12 bg-mint rounded-lg flex items-center justify-center text-2xl font-bold text-white">d</div>
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl font-bold text-text-primary">b</div>
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl font-bold text-text-primary">b</div>
                </div>
                <p className="text-sm text-text-secondary">
                  Click on the letters that are different (mirror versions).
                  <br />
                  You have 30 seconds per level!
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="bg-soft-blue hover:bg-blue-400 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg flex items-center gap-3 mx-auto"
              >
                <Play className="w-6 h-6" />
                Start Detecting
              </motion.button>
            </motion.div>
          )}

          {/* Playing Screen */}
          {gameState === 'playing' && currentGrid && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-text-secondary font-medium">
                  Level {currentLevel + 1} of {MIRROR_GRIDS.length}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-text-primary font-bold">
                    Found: {foundPositions.length}/{currentGrid.mirrorPositions.length}
                  </span>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                    timeLeft <= 10 ? 'bg-red-100 text-red-600' : 'bg-white/50 text-text-primary'
                  }`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">{timeLeft}s</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="text-center mb-6">
                <p className="text-text-secondary">
                  Find all the <span className="font-bold text-lavender">{currentGrid.mirrorLetter}</span> letters hiding among the <span className="font-bold text-text-primary">{currentGrid.targetLetter}</span> letters
                </p>
              </div>

              {/* Grid */}
              <div className="flex justify-center mb-6">
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${currentGrid.grid[0].length}, minmax(0, 1fr))`
                  }}
                >
                  {currentGrid.grid.map((row, rowIndex) =>
                    row.map((letter, colIndex) => {
                      const state = getCellState(rowIndex, colIndex);
                      return (
                        <motion.button
                          key={`${rowIndex}-${colIndex}`}
                          whileHover={state === 'normal' ? { scale: 1.1 } : {}}
                          whileTap={state === 'normal' ? { scale: 0.95 } : {}}
                          onClick={() => handleCellClick(rowIndex, colIndex)}
                          className={`w-14 h-14 rounded-xl text-2xl font-bold transition-all ${
                            state === 'found'
                              ? 'bg-mint text-white shadow-lg'
                              : state === 'wrong'
                              ? 'bg-red-200 text-red-600'
                              : 'bg-white hover:bg-gray-50 text-text-primary shadow-md hover:shadow-lg'
                          }`}
                          disabled={state !== 'normal'}
                        >
                          {state === 'found' ? (
                            <motion.span
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                            >
                              <CheckCircle className="w-6 h-6 mx-auto" />
                            </motion.span>
                          ) : state === 'wrong' ? (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <XCircle className="w-6 h-6 mx-auto" />
                            </motion.span>
                          ) : (
                            letter
                          )}
                        </motion.button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Score */}
              <div className="text-center">
                <span className="text-text-secondary">
                  Total Score: <span className="font-bold text-text-primary">{score}</span>
                </span>
              </div>
            </motion.div>
          )}

          {/* Level Complete Screen */}
          {gameState === 'levelComplete' && (
            <motion.div
              key="levelComplete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold text-text-primary mb-4">
                Level {currentLevel} Complete!
              </h2>
              <p className="text-text-secondary mb-6">
                You found {foundPositions.length} mirror letters!
              </p>
              <p className="text-text-primary font-medium mb-8">
                Ready for the next challenge?
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startNextLevel}
                className="bg-mint hover:bg-green-400 text-white font-bold py-4 px-12 rounded-full shadow-lg"
              >
                Next Level
              </motion.button>
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
              <h2 className="text-3xl font-bold text-text-primary mb-4">Detective Complete!</h2>
              <div className="text-6xl font-bold text-soft-blue mb-4">
                {score}/{totalMirrors}
              </div>
              <p className="text-text-secondary mb-8">
                You found {score} mirror letters across all levels!
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
