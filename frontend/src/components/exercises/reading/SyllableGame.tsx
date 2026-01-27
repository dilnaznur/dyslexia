/**
 * Syllable Segmentation Exercise
 * Evidence: Phonological awareness is crucial for reading development
 * Source: Goswami, U. (2002). Phonology, reading, and dyslexia
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, CheckCircle, XCircle, HandMetal } from 'lucide-react';
import { SYLLABLE_WORDS } from '@/data/exercises';
import RewardAnimation from '../RewardAnimation';
import { recordExerciseCompletion, UserProgress } from '@/lib/exerciseStorage';

interface SyllableGameProps {
  onBack: () => void;
  onComplete: (progress: UserProgress) => void;
}

export default function SyllableGame({ onBack, onComplete }: SyllableGameProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result' | 'reward'>('intro');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<typeof SYLLABLE_WORDS>([]);
  const [userSyllables, setUserSyllables] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [earnedStars, setEarnedStars] = useState(0);

  // Initialize the game
  const initializeGame = useCallback(() => {
    const shuffled = [...SYLLABLE_WORDS].sort(() => Math.random() - 0.5).slice(0, 8);
    setWords(shuffled);
    setCurrentWordIndex(0);
    setScore(0);
    setUserSyllables([]);
    setShowResult(false);
    setGameState('playing');
  }, []);

  const currentWord = words[currentWordIndex];

  // Handle syllable tap (click between letters)
  const handleLetterClick = (index: number) => {
    if (showResult) return;

    // Toggle syllable break at this position
    setUserSyllables((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      }
      return [...prev, index].sort((a, b) => a - b);
    });
  };

  // Check the answer
  const checkAnswer = () => {
    if (!currentWord) return;

    // Calculate correct break positions from syllables
    const correctBreaks: number[] = [];
    let position = 0;
    for (let i = 0; i < currentWord.syllables.length - 1; i++) {
      position += currentWord.syllables[i].length;
      correctBreaks.push(position);
    }

    // Check if user's breaks match
    const isMatch =
      userSyllables.length === correctBreaks.length &&
      userSyllables.every((pos, idx) => pos === correctBreaks[idx]);

    setIsCorrect(isMatch);
    setShowResult(true);

    if (isMatch) {
      setScore((s) => s + 1);
    }
  };

  // Move to next word
  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex((i) => i + 1);
      setUserSyllables([]);
      setShowResult(false);
    } else {
      finishGame();
    }
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
    const progress = recordExerciseCompletion('syllable-game', score, words.length);
    setGameState('result');
    onComplete(progress);
  };

  // Render the word with clickable gaps
  const renderWord = () => {
    if (!currentWord) return null;

    const letters = currentWord.word.split('');

    return (
      <div className="flex items-center justify-center gap-1">
        {letters.map((letter, index) => (
          <div key={index} className="flex items-center">
            <motion.span
              className="text-5xl font-bold text-text-primary"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              {letter}
            </motion.span>
            {index < letters.length - 1 && (
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleLetterClick(index + 1)}
                className={`w-6 h-16 mx-1 flex items-center justify-center transition-all ${
                  userSyllables.includes(index + 1)
                    ? 'bg-mint'
                    : 'bg-gray-200 hover:bg-gray-300'
                } rounded-lg`}
                disabled={showResult}
              >
                {userSyllables.includes(index + 1) && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1 h-12 bg-white rounded-full"
                  />
                )}
              </motion.button>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render correct syllables
  const renderCorrectSyllables = () => {
    if (!currentWord) return null;

    return (
      <div className="flex items-center justify-center gap-4 mt-4">
        {currentWord.syllables.map((syllable, index) => (
          <motion.span
            key={index}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.2 }}
            className="text-2xl font-bold text-mint bg-white/50 px-4 py-2 rounded-lg"
          >
            {syllable}
          </motion.span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender via-soft-blue to-mint p-8">
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
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                className="text-6xl mb-6"
              >
                ✂️
              </motion.div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">Syllable Splitter</h1>
              <p className="text-text-secondary mb-6">
                Click between letters to split words into syllables!
              </p>

              <div className="bg-white/30 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-text-primary mb-4">How to Play:</h3>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className="text-3xl font-bold text-text-primary">but</span>
                  <div className="w-4 h-10 bg-mint rounded flex items-center justify-center">
                    <div className="w-1 h-8 bg-white rounded-full" />
                  </div>
                  <span className="text-3xl font-bold text-text-primary">ter</span>
                  <div className="w-4 h-10 bg-mint rounded flex items-center justify-center">
                    <div className="w-1 h-8 bg-white rounded-full" />
                  </div>
                  <span className="text-3xl font-bold text-text-primary">fly</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Clap your hands for each syllable to help you count!
                </p>
                <HandMetal className="w-8 h-8 text-text-secondary mx-auto mt-2" />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="bg-lavender hover:bg-purple-400 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg flex items-center gap-3 mx-auto"
              >
                <Play className="w-6 h-6" />
                Start Game
              </motion.button>
            </motion.div>
          )}

          {/* Playing Screen */}
          {gameState === 'playing' && currentWord && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              {/* Progress */}
              <div className="flex justify-between items-center mb-6">
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
                  className="h-full bg-lavender"
                  animate={{ width: `${((currentWordIndex + 1) / words.length) * 100}%` }}
                />
              </div>

              {/* Instruction */}
              <p className="text-center text-text-secondary mb-8">
                Click between letters to separate syllables
              </p>

              {/* Word Display */}
              <div className="min-h-32 flex items-center justify-center mb-8">
                {renderWord()}
              </div>

              {/* Syllable count display */}
              <div className="text-center mb-8">
                <span className="text-text-secondary">
                  Syllables marked: {userSyllables.length + 1}
                </span>
              </div>

              {/* Result Feedback */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-6"
                >
                  {isCorrect ? (
                    <div>
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
                      <p className="text-xl font-bold text-green-500">Perfect!</p>
                    </div>
                  ) : (
                    <div>
                      <XCircle className="w-16 h-16 text-red-400 mx-auto mb-2" />
                      <p className="text-xl font-bold text-red-400 mb-2">Not quite!</p>
                      <p className="text-text-secondary mb-2">The correct syllables are:</p>
                      {renderCorrectSyllables()}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center">
                {!showResult ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={checkAnswer}
                    className="bg-mint hover:bg-green-400 text-white font-bold py-4 px-12 rounded-full shadow-lg"
                  >
                    Check Answer
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextWord}
                    className="bg-soft-blue hover:bg-blue-400 text-white font-bold py-4 px-12 rounded-full shadow-lg"
                  >
                    {currentWordIndex < words.length - 1 ? 'Next Word' : 'See Results'}
                  </motion.button>
                )}
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
              <h2 className="text-3xl font-bold text-text-primary mb-4">Game Complete!</h2>
              <div className="text-6xl font-bold text-lavender mb-4">
                {Math.round((score / words.length) * 100)}%
              </div>
              <p className="text-text-secondary mb-8">
                You split {score} out of {words.length} words correctly!
              </p>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={initializeGame}
                  className="bg-lavender hover:bg-purple-400 text-white font-bold py-3 px-8 rounded-full"
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
