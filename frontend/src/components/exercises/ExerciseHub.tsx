/**
 * ExerciseHub Component
 * Main hub for all dyslexia practice exercises
 * Provides navigation between exercise categories and individual exercises
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Brain, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { EXERCISE_CATEGORIES, ALL_EXERCISES } from '@/data/exercises';
import { loadProgress, UserProgress } from '@/lib/exerciseStorage';

import ProgressBar from './ProgressBar';
import ExerciseCard, { CategoryCard } from './ExerciseCard';

// Reading exercises
import WordFlash from './reading/WordFlash';
import SyllableGame from './reading/SyllableGame';
import ReadingTracker from './reading/ReadingTracker';

// Writing exercises
import LetterTracing from './writing/LetterTracing';
import MirrorDetective from './writing/MirrorDetective';

// Memory exercises
import SequenceMemory from './memory/SequenceMemory';
import OddOneOut from './memory/OddOneOut';
import SoundMatching from './memory/SoundMatching';

type ViewState = 'hub' | 'category' | 'exercise';
type CategoryId = 'reading' | 'writing' | 'memory';
type ExerciseId = string;

export default function ExerciseHub() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [viewState, setViewState] = useState<ViewState>('hub');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseId | null>(null);
  const [progress, setProgress] = useState<UserProgress>(loadProgress());

  // Reload progress when returning to hub
  useEffect(() => {
    if (viewState === 'hub' || viewState === 'category') {
      setProgress(loadProgress());
    }
  }, [viewState]);

  // Handle category selection
  const handleCategorySelect = (categoryId: CategoryId) => {
    setSelectedCategory(categoryId);
    setViewState('category');
  };

  // Handle exercise selection
  const handleExerciseSelect = (exerciseId: ExerciseId) => {
    setSelectedExercise(exerciseId);
    setViewState('exercise');
  };

  // Handle back navigation
  const handleBack = () => {
    if (viewState === 'exercise') {
      setSelectedExercise(null);
      setViewState('category');
    } else if (viewState === 'category') {
      setSelectedCategory(null);
      setViewState('hub');
    } else {
      navigate('/');
    }
  };

  // Handle exercise completion
  const handleExerciseComplete = (updatedProgress: UserProgress) => {
    setProgress(updatedProgress);
  };

  // Get completed count for a category
  const getCategoryCompletedCount = (categoryId: CategoryId) => {
    const category = EXERCISE_CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return 0;
    return category.exercises.filter((exId) => progress.exercises[exId]?.completed).length;
  };

  // Render exercise component
  const renderExercise = () => {
    const exerciseProps = {
      onBack: handleBack,
      onComplete: handleExerciseComplete,
    };

    switch (selectedExercise) {
      case 'word-flash':
        return <WordFlash {...exerciseProps} />;
      case 'syllable-game':
        return <SyllableGame {...exerciseProps} />;
      case 'reading-tracker':
        return <ReadingTracker {...exerciseProps} />;
      case 'letter-tracing':
        return <LetterTracing {...exerciseProps} />;
      case 'mirror-detective':
        return <MirrorDetective {...exerciseProps} />;
      case 'sequence-memory':
        return <SequenceMemory {...exerciseProps} />;
      case 'odd-one-out':
        return <OddOneOut {...exerciseProps} />;
      case 'sound-matching':
        return <SoundMatching {...exerciseProps} />;
      default:
        return null;
    }
  };

  // Get exercises for current category
  const getCategoryExercises = () => {
    if (!selectedCategory) return [];
    const category = EXERCISE_CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return [];
    return ALL_EXERCISES.filter((ex) => category.exercises.includes(ex.id));
  };

  return (
    <AnimatePresence mode="wait">
      {/* Exercise View */}
      {viewState === 'exercise' && selectedExercise && (
        <motion.div
          key="exercise"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {renderExercise()}
        </motion.div>
      )}

      {/* Category View */}
      {viewState === 'category' && selectedCategory && (
        <motion.div
          key="category"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="min-h-screen bg-gradient-to-br from-mint via-soft-blue to-lavender p-8"
        >
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={handleBack}
              className="flex items-center gap-2 text-white mb-8 hover:bg-white/20 px-4 py-2 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('exercises.hub.backToCategories')}
            </motion.button>

            {/* Category Title */}
            {(() => {
              const category = EXERCISE_CATEGORIES.find((c) => c.id === selectedCategory);
              return category ? (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-8"
                >
                  <span className="text-6xl mb-4 block">{category.emoji}</span>
                  <h1 className="text-4xl font-bold text-white mb-2">{t(`exercises.categories.${category.id}.name`)} {t('exercises.hub.exercises')}</h1>
                  <p className="text-white/80">{t(`exercises.categories.${category.id}.description`)}</p>
                </motion.div>
              ) : null;
            })()}

            {/* Exercise Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {getCategoryExercises().map((exercise, index) => (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ExerciseCard
                    id={exercise.id}
                    name={t(`exercises.${exercise.id}.name`, { defaultValue: exercise.name })}
                    emoji={exercise.emoji}
                    description={t(`exercises.${exercise.id}.description`, { defaultValue: exercise.description })}
                    difficulty={exercise.difficulty}
                    duration={exercise.duration}
                    progress={progress.exercises[exercise.id]}
                    onClick={() => handleExerciseSelect(exercise.id)}
                  />
                </motion.div>
              ))}
            </div>

            {/* Progress */}
            <ProgressBar progress={progress} totalExercises={ALL_EXERCISES.length} />
          </div>
        </motion.div>
      )}

      {/* Hub View */}
      {viewState === 'hub' && (
        <motion.div
          key="hub"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, x: -100 }}
          className="min-h-screen bg-gradient-to-br from-mint via-soft-blue to-lavender p-8"
        >
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white mb-8 hover:bg-white/20 px-4 py-2 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('exercises.hub.backToHome')}
            </motion.button>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block mb-4"
              >
                <Brain className="w-16 h-16 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold text-white mb-2">{t('exercises.hub.title')}</h1>
              <p className="text-white/80 text-lg">
                {t('exercises.hub.subtitle')}
              </p>
            </motion.div>

            {/* Category Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {EXERCISE_CATEGORIES.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                >
                  <CategoryCard
                    id={category.id}
                    name={t(`exercises.categories.${category.id}.name`, { defaultValue: category.name })}
                    emoji={category.emoji}
                    color={category.color}
                    description={t(`exercises.categories.${category.id}.description`, { defaultValue: category.description })}
                    exerciseCount={category.exercises.length}
                    completedCount={getCategoryCompletedCount(category.id as CategoryId)}
                    onClick={() => handleCategorySelect(category.id as CategoryId)}
                  />
                </motion.div>
              ))}
            </div>

            {/* Progress Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <ProgressBar progress={progress} totalExercises={ALL_EXERCISES.length} />
            </motion.div>

            {/* Motivational Banner (if has progress) */}
            {progress.exercisesCompleted > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 glass-card p-6 text-center"
              >
                <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-text-primary font-medium">
                  {progress.currentStreak > 0
                    ? t('exercises.hub.streakMessage', { count: progress.currentStreak })
                    : t('exercises.hub.keepPracticing')}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
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
    </AnimatePresence>
  );
}
