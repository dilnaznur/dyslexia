/**
 * Exercise Storage Utilities
 * Handles localStorage persistence for exercise progress and rewards
 * No backend required - all data stored locally
 */

export type Badge =
  | 'first_exercise'
  | 'perfect_score'
  | 'week_streak'
  | 'reading_master'
  | 'writing_wizard'
  | 'memory_champion'
  | 'speed_demon'
  | 'persistence';

export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  stars: number;      // 0-3
  bestScore: number;
  attempts: number;
  lastPlayed: string; // ISO date string
}

export interface UserProgress {
  exercisesCompleted: number;
  totalStars: number;
  currentStreak: number;
  longestStreak: number;
  lastPlayDate: string | null;
  badges: Badge[];
  exercises: Record<string, ExerciseProgress>;
}

const STORAGE_KEY = 'mindstep_exercises';

const DEFAULT_PROGRESS: UserProgress = {
  exercisesCompleted: 0,
  totalStars: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPlayDate: null,
  badges: [],
  exercises: {},
};

/**
 * Load user progress from localStorage
 */
export const loadProgress = (): UserProgress => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as UserProgress;
      // Update streak if needed
      return updateStreak(parsed);
    }
    return { ...DEFAULT_PROGRESS };
  } catch (error) {
    console.error('Failed to load exercise progress:', error);
    return { ...DEFAULT_PROGRESS };
  }
};

/**
 * Save user progress to localStorage
 */
export const saveProgress = (progress: UserProgress): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to save exercise progress:', error);
  }
};

/**
 * Update streak based on last play date
 */
const updateStreak = (progress: UserProgress): UserProgress => {
  if (!progress.lastPlayDate) return progress;

  const lastPlay = new Date(progress.lastPlayDate);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lastPlay.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    // Streak broken
    return {
      ...progress,
      currentStreak: 0,
    };
  }

  return progress;
};

/**
 * Record completion of an exercise
 */
export const recordExerciseCompletion = (
  exerciseId: string,
  score: number,
  maxScore: number
): UserProgress => {
  const progress = loadProgress();
  const today = new Date().toISOString().split('T')[0];
  const stars = calculateStars(score, maxScore);

  const existingExercise = progress.exercises[exerciseId];
  const isNewCompletion = !existingExercise?.completed;

  // Update exercise record
  progress.exercises[exerciseId] = {
    exerciseId,
    completed: true,
    stars: Math.max(stars, existingExercise?.stars || 0),
    bestScore: Math.max(score, existingExercise?.bestScore || 0),
    attempts: (existingExercise?.attempts || 0) + 1,
    lastPlayed: new Date().toISOString(),
  };

  // Update overall stats
  if (isNewCompletion) {
    progress.exercisesCompleted += 1;
  }

  // Update total stars (only add difference if improved)
  const starDiff = stars - (existingExercise?.stars || 0);
  if (starDiff > 0) {
    progress.totalStars += starDiff;
  }

  // Update streak
  if (progress.lastPlayDate !== today) {
    const lastPlay = progress.lastPlayDate ? new Date(progress.lastPlayDate) : null;
    const todayDate = new Date(today);

    if (lastPlay) {
      const diffDays = Math.floor((todayDate.getTime() - lastPlay.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        progress.currentStreak += 1;
      } else if (diffDays > 1) {
        progress.currentStreak = 1;
      }
    } else {
      progress.currentStreak = 1;
    }

    progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak);
    progress.lastPlayDate = today;
  }

  // Check for new badges
  progress.badges = checkForNewBadges(progress, stars);

  saveProgress(progress);
  return progress;
};

/**
 * Calculate stars based on score percentage
 */
const calculateStars = (score: number, maxScore: number): number => {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 3;
  if (percentage >= 70) return 2;
  if (percentage >= 50) return 1;
  return 0;
};

/**
 * Check and award new badges
 */
const checkForNewBadges = (progress: UserProgress, latestStars: number): Badge[] => {
  const badges = [...progress.badges];

  // First exercise badge
  if (progress.exercisesCompleted >= 1 && !badges.includes('first_exercise')) {
    badges.push('first_exercise');
  }

  // Perfect score badge
  if (latestStars === 3 && !badges.includes('perfect_score')) {
    badges.push('perfect_score');
  }

  // Week streak badge
  if (progress.currentStreak >= 7 && !badges.includes('week_streak')) {
    badges.push('week_streak');
  }

  // Category master badges
  const readingExercises = ['word-flash', 'syllable-game', 'reading-tracker'];
  const writingExercises = ['letter-tracing', 'mirror-detective'];
  const memoryExercises = ['sequence-memory', 'odd-one-out', 'sound-matching'];

  const completedReading = readingExercises.filter(id => progress.exercises[id]?.completed).length;
  const completedWriting = writingExercises.filter(id => progress.exercises[id]?.completed).length;
  const completedMemory = memoryExercises.filter(id => progress.exercises[id]?.completed).length;

  if (completedReading === readingExercises.length && !badges.includes('reading_master')) {
    badges.push('reading_master');
  }

  if (completedWriting === writingExercises.length && !badges.includes('writing_wizard')) {
    badges.push('writing_wizard');
  }

  if (completedMemory === memoryExercises.length && !badges.includes('memory_champion')) {
    badges.push('memory_champion');
  }

  // Persistence badge (10+ total attempts)
  const totalAttempts = Object.values(progress.exercises).reduce((sum, ex) => sum + ex.attempts, 0);
  if (totalAttempts >= 10 && !badges.includes('persistence')) {
    badges.push('persistence');
  }

  return badges;
};

/**
 * Get exercise stats for display
 */
export const getExerciseStats = (exerciseId: string): ExerciseProgress | null => {
  const progress = loadProgress();
  return progress.exercises[exerciseId] || null;
};

/**
 * Reset all progress (for testing)
 */
export const resetProgress = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Get badge display info
 */
export const getBadgeInfo = (badge: Badge): { name: string; emoji: string; description: string } => {
  const badges: Record<Badge, { name: string; emoji: string; description: string }> = {
    first_exercise: {
      name: 'First Steps',
      emoji: '🎯',
      description: 'Complete your first exercise',
    },
    perfect_score: {
      name: 'Perfect!',
      emoji: '⭐',
      description: 'Get 3 stars on any exercise',
    },
    week_streak: {
      name: 'Week Warrior',
      emoji: '🔥',
      description: 'Practice for 7 days in a row',
    },
    reading_master: {
      name: 'Reading Master',
      emoji: '📚',
      description: 'Complete all reading exercises',
    },
    writing_wizard: {
      name: 'Writing Wizard',
      emoji: '✍️',
      description: 'Complete all writing exercises',
    },
    memory_champion: {
      name: 'Memory Champion',
      emoji: '🧠',
      description: 'Complete all memory exercises',
    },
    speed_demon: {
      name: 'Speed Demon',
      emoji: '⚡',
      description: 'Complete an exercise super fast',
    },
    persistence: {
      name: 'Never Give Up',
      emoji: '💪',
      description: 'Play exercises 10 times',
    },
  };

  return badges[badge];
};
