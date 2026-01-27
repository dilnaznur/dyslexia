/**
 * RewardAnimation Component
 * Displays celebration animations for achievements
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Star, Trophy, Flame, Sparkles } from 'lucide-react';
import { Badge, getBadgeInfo } from '@/lib/exerciseStorage';
import { getRandomEncouragement } from '@/data/exercises';

interface RewardAnimationProps {
  type: 'stars' | 'badge' | 'completion' | 'perfect';
  stars?: number;
  badge?: Badge;
  onComplete?: () => void;
}

export default function RewardAnimation({ type, stars = 0, badge, onComplete }: RewardAnimationProps) {
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setMessage(getRandomEncouragement());

    // Trigger confetti for perfect scores and completions
    if (type === 'perfect' || type === 'completion') {
      triggerConfetti();
    }

    // Auto-hide after animation
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) {
        setTimeout(onComplete, 500);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  const triggerConfetti = () => {
    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Second burst (delayed)
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 400);
  };

  const renderContent = () => {
    switch (type) {
      case 'stars':
        return (
          <div className="text-center">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{
                    scale: i <= stars ? 1 : 0.5,
                    rotate: 0,
                    opacity: i <= stars ? 1 : 0.3,
                  }}
                  transition={{ delay: i * 0.2, type: 'spring', stiffness: 200 }}
                >
                  <Star
                    className={`w-16 h-16 ${
                      i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                    }`}
                  />
                </motion.div>
              ))}
            </div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-2xl font-bold text-white"
            >
              {stars === 3 ? 'Perfect Score!' : stars === 2 ? 'Great Job!' : stars === 1 ? 'Good Try!' : 'Keep Practicing!'}
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-lg text-white/80 mt-2"
            >
              {message}
            </motion.p>
          </div>
        );

      case 'badge':
        const badgeInfo = badge ? getBadgeInfo(badge) : null;
        return badgeInfo ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mb-4"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <span className="text-5xl">{badgeInfo.emoji}</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <p className="text-sm text-white/80 uppercase tracking-wide">New Badge!</p>
              <h3 className="text-2xl font-bold text-white mt-1">{badgeInfo.name}</h3>
              <p className="text-white/80 mt-2">{badgeInfo.description}</p>
            </motion.div>
          </div>
        ) : null;

      case 'completion':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mb-4"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-mint to-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Sparkles className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white"
            >
              Exercise Complete!
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-white/80 mt-2"
            >
              {message}
            </motion.p>
          </div>
        );

      case 'perfect':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="mb-4"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.15, type: 'spring' }}
                >
                  <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                </motion.div>
              ))}
            </div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-2xl font-bold text-white"
            >
              Perfect Score!
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-lg text-white/80 mt-2"
            >
              You're absolutely amazing!
            </motion.p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setIsVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="p-8"
            onClick={(e) => e.stopPropagation()}
          >
            {renderContent()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Mini star rating display for cards
export function StarRating({ stars, size = 'md' }: { stars: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          className={`${sizeClasses[size]} ${
            i <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

// Streak flame animation
export function StreakFlame({ streak }: { streak: number }) {
  if (streak === 0) return null;

  return (
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
      }}
      className="flex items-center gap-1 bg-orange-100 px-3 py-1 rounded-full"
    >
      <Flame className="w-5 h-5 text-orange-500" />
      <span className="font-bold text-orange-600">{streak}</span>
    </motion.div>
  );
}
