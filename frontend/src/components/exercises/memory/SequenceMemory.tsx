/**
 * Sequence Memory Exercise
 * Evidence: Working memory training improves cognitive processing
 * Source: Gathercole, S. (2008). Working memory in learning
 */
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Heart, RotateCcw } from 'lucide-react';
import { SEQUENCE_SHAPES, SEQUENCE_LEVELS } from '@/data/exercises';
import RewardAnimation from '../RewardAnimation';
import { recordExerciseCompletion, UserProgress } from '@/lib/exerciseStorage';

interface SequenceMemoryProps {
  onBack: () => void;
  onComplete: (progress: UserProgress) => void;
}

type GamePhase = 'intro' | 'showing' | 'input' | 'feedback' | 'result' | 'reward';

export default function SequenceMemory({ onBack, onComplete }: SequenceMemoryProps) {
  const [gameState, setGameState] = useState<GamePhase>('intro');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showingIndex, setShowingIndex] = useState(-1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  const level = SEQUENCE_LEVELS[currentLevel];
  const shapes = SEQUENCE_SHAPES.slice(0, 5); // Use first 5 shapes

  // Generate new sequence
  const generateSequence = useCallback(() => {
    const newSequence: number[] = [];
    for (let i = 0; i < level.sequenceLength; i++) {
      newSequence.push(Math.floor(Math.random() * shapes.length));
    }
    return newSequence;
  }, [level, shapes.length]);

  // Start showing sequence
  const startLevel = useCallback(() => {
    const newSequence = generateSequence();
    setSequence(newSequence);
    setUserSequence([]);
    setShowingIndex(-1);
    setGameState('showing');

    // Start showing animation
    let index = 0;
    const showNext = () => {
      if (index < newSequence.length) {
        setShowingIndex(index);
        setTimeout(() => {
          setShowingIndex(-1);
          setTimeout(() => {
            index++;
            showNext();
          }, 200);
        }, level.showTime);
      } else {
        setGameState('input');
      }
    };

    setTimeout(showNext, 500);
  }, [generateSequence, level.showTime]);

  // Initialize the game
  const initializeGame = useCallback(() => {
    setCurrentLevel(0);
    setLives(3);
    setScore(0);
    setUserSequence([]);
    startLevel();
  }, [startLevel]);

  // Handle shape click
  const handleShapeClick = (shapeIndex: number) => {
    if (gameState !== 'input') return;

    const newUserSequence = [...userSequence, shapeIndex];
    setUserSequence(newUserSequence);

    // Check if current input is correct
    const currentPosition = newUserSequence.length - 1;
    if (newUserSequence[currentPosition] !== sequence[currentPosition]) {
      // Wrong answer
      handleWrongAnswer();
      return;
    }

    // Check if sequence is complete
    if (newUserSequence.length === sequence.length) {
      handleCorrectSequence();
    }
  };

  // Handle correct sequence
  const handleCorrectSequence = () => {
    setIsCorrect(true);
    setScore((s) => s + level.sequenceLength);
    setGameState('feedback');

    setTimeout(() => {
      if (currentLevel < SEQUENCE_LEVELS.length - 1) {
        setCurrentLevel((l) => l + 1);
        startLevel();
      } else {
        finishGame();
      }
    }, 1500);
  };

  // Handle wrong answer
  const handleWrongAnswer = () => {
    setIsCorrect(false);
    setLives((l) => l - 1);
    setGameState('feedback');

    setTimeout(() => {
      if (lives - 1 <= 0) {
        finishGame();
      } else {
        startLevel();
      }
    }, 1500);
  };

  // Finish the game
  const finishGame = () => {
    const maxScore = SEQUENCE_LEVELS.reduce((sum, l) => sum + l.sequenceLength, 0);
    const percentage = Math.round((score / maxScore) * 100);
    let stars = 0;
    if (percentage >= 80) stars = 3;
    else if (percentage >= 50) stars = 2;
    else if (percentage >= 25) stars = 1;

    setEarnedStars(stars);
    setGameState('reward');
  };

  // Handle reward animation complete
  const handleRewardComplete = () => {
    const maxScore = SEQUENCE_LEVELS.reduce((sum, l) => sum + l.sequenceLength, 0);
    const progress = recordExerciseCompletion('sequence-memory', score, maxScore);
    setGameState('result');
    onComplete(progress);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint via-soft-blue to-lavender p-8">
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
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                🎯
              </motion.div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">Sequence Memory</h1>
              <p className="text-text-secondary mb-6">
                Watch the shapes light up, then repeat the sequence!
              </p>

              <div className="bg-white/30 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-text-primary mb-4">How to Play:</h3>
                <div className="flex justify-center gap-2 mb-4">
                  {shapes.slice(0, 4).map((shape, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-md"
                    >
                      {shape.emoji}
                    </motion.div>
                  ))}
                </div>
                <p className="text-sm text-text-secondary">
                  Watch carefully, then click the shapes in the same order.
                  <br />
                  You have 3 lives!
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

          {/* Game Screen (showing, input, feedback) */}
          {['showing', 'input', 'feedback'].includes(gameState) && (
            <motion.div
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary">Level {currentLevel + 1}</span>
                  <span className="text-xs text-text-secondary/70">
                    ({level.sequenceLength} shapes)
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-text-primary font-bold">Score: {score}</span>
                  <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-6 h-6 ${
                          i < lives
                            ? 'text-red-500 fill-red-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="text-center mb-8">
                <AnimatePresence mode="wait">
                  {gameState === 'showing' && (
                    <motion.p
                      key="watch"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xl text-text-primary font-medium"
                    >
                      Watch carefully...
                    </motion.p>
                  )}
                  {gameState === 'input' && (
                    <motion.p
                      key="input"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xl text-text-primary font-medium"
                    >
                      Your turn! ({userSequence.length}/{sequence.length})
                    </motion.p>
                  )}
                  {gameState === 'feedback' && (
                    <motion.div
                      key="feedback"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {isCorrect ? (
                        <p className="text-xl text-green-500 font-bold">Perfect!</p>
                      ) : (
                        <p className="text-xl text-red-500 font-bold">Oops! Try again</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Shape Grid */}
              <div className="flex justify-center gap-4 flex-wrap mb-8">
                {shapes.map((shape, index) => (
                  <motion.button
                    key={shape.id}
                    whileHover={gameState === 'input' ? { scale: 1.1 } : {}}
                    whileTap={gameState === 'input' ? { scale: 0.95 } : {}}
                    animate={{
                      scale: showingIndex === index ? 1.2 : 1,
                      backgroundColor: showingIndex === index ? shape.color : '#FFFFFF',
                    }}
                    onClick={() => handleShapeClick(index)}
                    disabled={gameState !== 'input'}
                    className={`w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center text-4xl transition-all ${
                      gameState === 'input'
                        ? 'cursor-pointer hover:shadow-xl'
                        : 'cursor-default'
                    }`}
                    style={{
                      boxShadow: showingIndex === index
                        ? `0 0 30px ${shape.color}`
                        : undefined,
                    }}
                  >
                    {shape.emoji}
                  </motion.button>
                ))}
              </div>

              {/* User sequence indicator */}
              {gameState === 'input' && userSequence.length > 0 && (
                <div className="flex justify-center gap-2">
                  {userSequence.map((shapeIndex, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-white shadow-md"
                    >
                      {shapes[shapeIndex].emoji}
                    </motion.div>
                  ))}
                </div>
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
              <h2 className="text-3xl font-bold text-text-primary mb-4">Great Memory!</h2>
              <div className="text-6xl font-bold text-mint mb-4">
                {score}
              </div>
              <p className="text-text-secondary mb-2">Points earned</p>
              <p className="text-text-secondary mb-8">
                You reached level {currentLevel + 1}!
              </p>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={initializeGame}
                  className="bg-mint hover:bg-green-400 text-white font-bold py-3 px-8 rounded-full"
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
