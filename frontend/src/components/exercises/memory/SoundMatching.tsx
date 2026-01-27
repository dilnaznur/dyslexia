/**
 * Sound Matching Exercise
 * Evidence: Phonemic awareness is critical for reading development
 * Source: Bradley & Bryant (1983). Rhyme and reading research
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Volume2, CheckCircle, XCircle } from 'lucide-react';
import { SOUND_MATCHING_ROUNDS } from '@/data/exercises';
import RewardAnimation from '../RewardAnimation';
import { recordExerciseCompletion, UserProgress } from '@/lib/exerciseStorage';

interface SoundMatchingProps {
  onBack: () => void;
  onComplete: (progress: UserProgress) => void;
}

export default function SoundMatching({ onBack, onComplete }: SoundMatchingProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'feedback' | 'result' | 'reward'>('intro');
  const [rounds, setRounds] = useState<typeof SOUND_MATCHING_ROUNDS>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  const currentRound = rounds[currentRoundIndex];

  // Initialize the game
  const initializeGame = useCallback(() => {
    const shuffled = [...SOUND_MATCHING_ROUNDS].sort(() => Math.random() - 0.5).slice(0, 8);
    setRounds(shuffled);
    setCurrentRoundIndex(0);
    setSelectedIndex(null);
    setScore(0);
    setGameState('playing');
  }, []);

  // Play word sound using Web Speech API
  const playWordSound = (word: string) => {
    setIsPlayingSound(true);

    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.8; // Slower for children
      utterance.pitch = 1.1; // Slightly higher pitch
      utterance.volume = 1;

      utterance.onend = () => {
        setIsPlayingSound(false);
      };

      utterance.onerror = () => {
        setIsPlayingSound(false);
      };

      speechSynthesis.speak(utterance);
    } else {
      // Fallback - just show the word briefly
      setTimeout(() => setIsPlayingSound(false), 500);
    }
  };

  // Handle option selection
  const handleOptionClick = (index: number) => {
    if (gameState !== 'playing' || selectedIndex !== null) return;

    setSelectedIndex(index);
    const correct = currentRound.options[index].isMatch;
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
    }, 2000);
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
    const progress = recordExerciseCompletion('sound-matching', score, rounds.length);
    setGameState('result');
    onComplete(progress);
  };

  // Get option state
  const getOptionState = (index: number): 'normal' | 'correct' | 'wrong' | 'missed' => {
    if (selectedIndex === null) return 'normal';
    if (index === selectedIndex) {
      return isCorrect ? 'correct' : 'wrong';
    }
    if (currentRound?.options[index].isMatch && !isCorrect) {
      return 'missed';
    }
    return 'normal';
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
                🔊
              </motion.div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">Sound Matching</h1>
              <p className="text-text-secondary mb-6">
                Listen to the word and find which word sounds similar!
              </p>

              <div className="bg-white/30 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-text-primary mb-4">How to Play:</h3>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="flex items-center gap-2 bg-soft-blue text-white px-4 py-2 rounded-full">
                    <Volume2 className="w-5 h-5" />
                    <span className="font-bold">cat</span>
                  </div>
                  <span className="text-2xl">→</span>
                  <div className="flex gap-2">
                    <span className="text-3xl">🎩</span>
                    <span className="font-bold text-mint">hat</span>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">
                  Find words that rhyme or start with the same sound!
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="bg-soft-blue hover:bg-blue-400 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg flex items-center gap-3 mx-auto"
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
                  className="h-full bg-soft-blue"
                  animate={{ width: `${((currentRoundIndex + 1) / rounds.length) * 100}%` }}
                />
              </div>

              {/* Match type instruction */}
              <p className="text-center text-text-secondary mb-4">
                {currentRound.matchType === 'rhyme'
                  ? 'Find the word that RHYMES with:'
                  : 'Find the word that STARTS with the same sound as:'}
              </p>

              {/* Target Word */}
              <div className="flex justify-center mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => playWordSound(currentRound.targetWord)}
                  disabled={isPlayingSound}
                  className={`flex items-center gap-3 bg-soft-blue text-white px-8 py-4 rounded-full shadow-lg text-2xl font-bold ${
                    isPlayingSound ? 'animate-pulse' : ''
                  }`}
                >
                  <motion.div
                    animate={isPlayingSound ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: isPlayingSound ? Infinity : 0 }}
                  >
                    <Volume2 className="w-8 h-8" />
                  </motion.div>
                  {currentRound.targetWord}
                </motion.button>
              </div>

              {/* Tap to hear instruction */}
              <p className="text-center text-text-secondary text-sm mb-6">
                Tap the word above to hear it again!
              </p>

              {/* Options */}
              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                {currentRound.options.map((option, index) => {
                  const state = getOptionState(index);
                  return (
                    <motion.button
                      key={index}
                      whileHover={selectedIndex === null ? { scale: 1.05 } : {}}
                      whileTap={selectedIndex === null ? { scale: 0.95 } : {}}
                      onClick={() => handleOptionClick(index)}
                      disabled={selectedIndex !== null}
                      className={`p-4 rounded-2xl transition-all shadow-lg flex flex-col items-center gap-2 ${
                        state === 'correct'
                          ? 'bg-green-400 text-white'
                          : state === 'wrong'
                          ? 'bg-red-400 text-white'
                          : state === 'missed'
                          ? 'bg-yellow-400 text-white ring-4 ring-yellow-200'
                          : 'bg-white text-text-primary hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-4xl">{option.emoji}</span>
                      <span className="font-bold text-lg">{option.word}</span>
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
                    <div>
                      <p className="text-xl font-bold text-green-500 mb-2">Correct!</p>
                      <p className="text-text-secondary">
                        "{currentRound.targetWord}" and "{currentRound.options.find(o => o.isMatch)?.word}"
                        {currentRound.matchType === 'rhyme' ? ' rhyme!' : ' start the same!'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xl font-bold text-red-500 mb-2">Not quite!</p>
                      <p className="text-text-secondary">
                        The correct answer was "{currentRound.options.find(o => o.isMatch)?.word}"
                      </p>
                    </div>
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
              <h2 className="text-3xl font-bold text-text-primary mb-4">Great Listening!</h2>
              <div className="text-6xl font-bold text-soft-blue mb-4">
                {Math.round((score / rounds.length) * 100)}%
              </div>
              <p className="text-text-secondary mb-8">
                You matched {score} out of {rounds.length} sounds correctly!
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
