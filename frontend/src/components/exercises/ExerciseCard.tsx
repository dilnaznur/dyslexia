/**
 * ExerciseCard Component
 * Individual exercise card for the hub grid
 */
import { motion } from 'framer-motion';
import { Clock, Lock, CheckCircle, ChevronRight } from 'lucide-react';
import { StarRating } from './RewardAnimation';
import { ExerciseProgress } from '@/lib/exerciseStorage';

interface ExerciseCardProps {
  id: string;
  name: string;
  emoji: string;
  description: string;
  difficulty: string;
  duration: string;
  progress?: ExerciseProgress | null;
  locked?: boolean;
  onClick: () => void;
}

export default function ExerciseCard({
  id,
  name,
  emoji,
  description,
  difficulty,
  duration,
  progress,
  locked = false,
  onClick,
}: ExerciseCardProps) {
  const isCompleted = progress?.completed;
  const stars = progress?.stars || 0;

  const difficultyColors = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700',
  };

  return (
    <motion.div
      whileHover={locked ? {} : { scale: 1.03, y: -5 }}
      whileTap={locked ? {} : { scale: 0.98 }}
      onClick={locked ? undefined : onClick}
      className={`glass-card p-6 cursor-pointer relative overflow-hidden ${
        locked ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      {/* Completion badge */}
      {isCompleted && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3"
        >
          <div className="w-8 h-8 bg-mint rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
        </motion.div>
      )}

      {/* Lock overlay */}
      {locked && (
        <div className="absolute inset-0 bg-gray-200/50 backdrop-blur-sm flex items-center justify-center rounded-glass">
          <Lock className="w-8 h-8 text-gray-500" />
        </div>
      )}

      {/* Emoji icon */}
      <div className="mb-4">
        <motion.span
          className="text-5xl"
          animate={isCompleted ? {} : { rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
        >
          {emoji}
        </motion.span>
      </div>

      {/* Name and description */}
      <h3 className="text-xl font-bold text-text-primary mb-2">{name}</h3>
      <p className="text-text-secondary text-sm mb-4 line-clamp-2">{description}</p>

      {/* Stars (if completed) */}
      {isCompleted && (
        <div className="mb-4">
          <StarRating stars={stars} size="sm" />
        </div>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 text-sm">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty as keyof typeof difficultyColors] || difficultyColors.Easy}`}>
          {difficulty}
        </span>
        <span className="flex items-center gap-1 text-text-secondary">
          <Clock className="w-4 h-4" />
          {duration}
        </span>
      </div>

      {/* Play arrow */}
      {!locked && !isCompleted && (
        <motion.div
          className="absolute bottom-4 right-4"
          animate={{ x: [0, 5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronRight className="w-6 h-6 text-soft-blue" />
        </motion.div>
      )}

      {/* Best score for completed */}
      {progress && progress.bestScore > 0 && (
        <div className="absolute bottom-4 right-4 text-xs text-text-secondary">
          Best: {progress.bestScore}%
        </div>
      )}

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px) saturate(180%);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
        }
        .glass-card:hover {
          box-shadow: 0 12px 40px rgba(31, 38, 135, 0.25);
        }
        .rounded-glass {
          border-radius: 20px;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </motion.div>
  );
}

// Category card for the main hub
interface CategoryCardProps {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
  exerciseCount: number;
  completedCount: number;
  onClick: () => void;
}

export function CategoryCard({
  id,
  name,
  emoji,
  color,
  description,
  exerciseCount,
  completedCount,
  onClick,
}: CategoryCardProps) {
  const allCompleted = completedCount === exerciseCount && exerciseCount > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-8 rounded-3xl cursor-pointer overflow-hidden bg-gradient-to-br ${color}`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 text-8xl">{emoji}</div>
        <div className="absolute bottom-4 left-4 text-6xl rotate-12">{emoji}</div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <motion.span
          className="text-6xl block mb-4"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {emoji}
        </motion.span>
        <h3 className="text-2xl font-bold text-white mb-2">{name}</h3>
        <p className="text-white/80 text-sm mb-4">{description}</p>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / exerciseCount) * 100}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </div>
          <span className="text-white text-sm font-medium">
            {completedCount}/{exerciseCount}
          </span>
        </div>

        {/* Completion badge */}
        {allCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg"
          >
            <CheckCircle className="w-6 h-6 text-green-500" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
