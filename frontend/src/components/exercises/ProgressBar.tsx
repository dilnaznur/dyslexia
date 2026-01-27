/**
 * ProgressBar Component
 * Displays user progress and streak information
 */
import { motion } from 'framer-motion';
import { Flame, Star, Trophy, Target } from 'lucide-react';
import { UserProgress, getBadgeInfo } from '@/lib/exerciseStorage';

interface ProgressBarProps {
  progress: UserProgress;
  totalExercises?: number;
}

export default function ProgressBar({ progress, totalExercises = 8 }: ProgressBarProps) {
  const completionPercentage = Math.round((progress.exercisesCompleted / totalExercises) * 100);

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-card p-6"
    >
      {/* Main Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Exercises Completed */}
        <div className="text-center">
          <div className="w-12 h-12 bg-soft-blue rounded-full flex items-center justify-center mx-auto mb-2">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {progress.exercisesCompleted}/{totalExercises}
          </div>
          <div className="text-sm text-text-secondary">Exercises Done</div>
        </div>

        {/* Stars */}
        <div className="text-center">
          <div className="w-12 h-12 bg-pale-yellow rounded-full flex items-center justify-center mx-auto mb-2">
            <Star className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {progress.totalStars}
          </div>
          <div className="text-sm text-text-secondary">Total Stars</div>
        </div>

        {/* Streak */}
        <div className="text-center">
          <div className="w-12 h-12 bg-peach rounded-full flex items-center justify-center mx-auto mb-2">
            <Flame className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {progress.currentStreak}
          </div>
          <div className="text-sm text-text-secondary">Day Streak</div>
        </div>

        {/* Badges */}
        <div className="text-center">
          <div className="w-12 h-12 bg-lavender rounded-full flex items-center justify-center mx-auto mb-2">
            <Trophy className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {progress.badges.length}
          </div>
          <div className="text-sm text-text-secondary">Badges</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-text-primary">Overall Progress</span>
          <span className="text-sm font-medium text-text-primary">{completionPercentage}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-mint to-soft-blue rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Badges Display */}
      {progress.badges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-text-primary mb-2">Your Badges</h4>
          <div className="flex flex-wrap gap-2">
            {progress.badges.map((badge) => {
              const badgeInfo = getBadgeInfo(badge);
              return (
                <motion.div
                  key={badge}
                  whileHover={{ scale: 1.1 }}
                  className="flex items-center gap-1 bg-white/50 px-3 py-1 rounded-full"
                  title={badgeInfo.description}
                >
                  <span className="text-lg">{badgeInfo.emoji}</span>
                  <span className="text-xs text-text-primary">{badgeInfo.name}</span>
                </motion.div>
              );
            })}
          </div>
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
      `}</style>
    </motion.div>
  );
}
