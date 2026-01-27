/**
 * Letter Tracing Exercise
 * Evidence: Motor memory and visual-motor integration improve letter formation
 * Source: Berninger, V. (2012). Handwriting and dyslexia research
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, RotateCcw, ArrowRight } from 'lucide-react';
import { TRACING_LETTERS } from '@/data/exercises';
import RewardAnimation from '../RewardAnimation';
import { recordExerciseCompletion, UserProgress } from '@/lib/exerciseStorage';

interface LetterTracingProps {
  onBack: () => void;
  onComplete: (progress: UserProgress) => void;
}

interface Point {
  x: number;
  y: number;
}

export default function LetterTracing({ onBack, onComplete }: LetterTracingProps) {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'result' | 'reward'>('intro');
  const [letters, setLetters] = useState<string[]>([]);
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [score, setScore] = useState(0);
  const [letterScores, setLetterScores] = useState<number[]>([]);
  const [earnedStars, setEarnedStars] = useState(0);
  const [showSparkle, setShowSparkle] = useState<Point | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLetter = letters[currentLetterIndex];

  // Initialize the game
  const initializeGame = useCallback(() => {
    // Focus on commonly confused letters for dyslexia
    const confusedLetters = [...TRACING_LETTERS.confusionPairs];
    // Add some regular letters
    const regularLetters = ['a', 'e', 'm', 'n', 's', 'c'];
    const allLetters = [...confusedLetters, ...regularLetters.slice(0, 4)];
    const shuffled = allLetters.sort(() => Math.random() - 0.5);

    setLetters(shuffled);
    setCurrentLetterIndex(0);
    setStrokes([]);
    setCurrentStroke([]);
    setScore(0);
    setLetterScores([]);
    setGameState('playing');
  }, []);

  // Set up canvas
  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 300;

    // Clear and draw guide letter
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw guide letter (dotted outline)
    ctx.font = 'bold 200px OpenDyslexic, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.strokeText(currentLetter?.toUpperCase() || '', canvas.width / 2, canvas.height / 2);
    ctx.setLineDash([]);

    // Draw existing strokes
    strokes.forEach((stroke) => {
      if (stroke.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = '#A8E6CF';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length > 1) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
      currentStroke.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = '#89CFF0';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  }, [gameState, currentLetter, strokes, currentStroke]);

  // Get mouse/touch position relative to canvas
  const getPosition = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // Drawing handlers
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const pos = getPosition(e);
    setCurrentStroke([pos]);
    setShowSparkle(pos);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPosition(e);
    setCurrentStroke((prev) => [...prev, pos]);
    setShowSparkle(pos);
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
    setShowSparkle(null);
  };

  // Clear canvas
  const clearCanvas = () => {
    setStrokes([]);
    setCurrentStroke([]);
  };

  // Calculate score for current letter
  const calculateLetterScore = (): number => {
    // Simple scoring based on stroke coverage
    // In a real app, this would compare to actual letter paths
    const totalPoints = strokes.reduce((sum, stroke) => sum + stroke.length, 0);

    if (totalPoints < 10) return 0;
    if (totalPoints < 30) return 1;
    if (totalPoints < 80) return 2;
    return 3;
  };

  // Submit current letter and move to next
  const submitLetter = () => {
    const letterScore = calculateLetterScore();
    setLetterScores((prev) => [...prev, letterScore]);
    setScore((s) => s + letterScore);

    if (currentLetterIndex < letters.length - 1) {
      setCurrentLetterIndex((i) => i + 1);
      setStrokes([]);
      setCurrentStroke([]);
    } else {
      finishGame();
    }
  };

  // Finish the game
  const finishGame = () => {
    const maxScore = letters.length * 3;
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
    const maxScore = letters.length * 3;
    const progress = recordExerciseCompletion('letter-tracing', score, maxScore);
    setGameState('result');
    onComplete(progress);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender via-peach to-pale-yellow p-8">
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
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-6"
              >
                ✏️
              </motion.div>
              <h1 className="text-3xl font-bold text-text-primary mb-4">Letter Tracing</h1>
              <p className="text-text-secondary mb-6">
                Trace letters with your finger or mouse to practice their shapes!
              </p>

              <div className="bg-white/30 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-text-primary mb-4">Tips:</h3>
                <ul className="text-left text-text-secondary space-y-2">
                  <li>• Follow the dotted letter guide</li>
                  <li>• Take your time - accuracy is more important than speed</li>
                  <li>• Pay special attention to b, d, p, and q - they can be tricky!</li>
                  <li>• You can clear and try again if needed</li>
                </ul>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={initializeGame}
                className="bg-lavender hover:bg-purple-400 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg flex items-center gap-3 mx-auto"
              >
                <Play className="w-6 h-6" />
                Start Tracing
              </motion.button>
            </motion.div>
          )}

          {/* Playing Screen */}
          {gameState === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card p-8"
            >
              {/* Progress */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-text-secondary">
                  Letter {currentLetterIndex + 1} of {letters.length}
                </span>
                <span className="text-text-primary font-bold">
                  Score: {score}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-lavender"
                  animate={{ width: `${((currentLetterIndex + 1) / letters.length) * 100}%` }}
                />
              </div>

              {/* Letter info */}
              <div className="text-center mb-4">
                <p className="text-text-secondary">
                  Trace the letter: <span className="text-3xl font-bold text-text-primary">{currentLetter?.toUpperCase()}</span>
                </p>
                {TRACING_LETTERS.confusionPairs.includes(currentLetter) && (
                  <p className="text-sm text-lavender mt-1">
                    This letter is often confused - take your time!
                  </p>
                )}
              </div>

              {/* Canvas Container */}
              <div
                ref={containerRef}
                className="relative bg-white rounded-2xl shadow-inner mx-auto mb-6 touch-none"
                style={{ width: 300, height: 300 }}
              >
                <canvas
                  ref={canvasRef}
                  className="cursor-crosshair rounded-2xl"
                  onMouseDown={handleStart}
                  onMouseMove={handleMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onTouchStart={handleStart}
                  onTouchMove={handleMove}
                  onTouchEnd={handleEnd}
                  style={{ width: '100%', height: '100%' }}
                />

                {/* Sparkle effect */}
                {showSparkle && (
                  <motion.div
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute w-4 h-4 bg-yellow-300 rounded-full pointer-events-none"
                    style={{
                      left: showSparkle.x - 8,
                      top: showSparkle.y - 8,
                    }}
                  />
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={clearCanvas}
                  className="flex items-center gap-2 bg-white/50 hover:bg-white/70 text-text-primary font-bold py-3 px-6 rounded-full"
                >
                  <RotateCcw className="w-5 h-5" />
                  Clear
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={submitLetter}
                  className="flex items-center gap-2 bg-mint hover:bg-green-400 text-white font-bold py-3 px-6 rounded-full shadow-lg"
                >
                  {currentLetterIndex < letters.length - 1 ? 'Next' : 'Finish'}
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
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
              <h2 className="text-3xl font-bold text-text-primary mb-4">Great Tracing!</h2>
              <div className="text-6xl font-bold text-lavender mb-4">
                {score}/{letters.length * 3}
              </div>
              <p className="text-text-secondary mb-6">
                You traced {letters.length} letters!
              </p>

              {/* Letter breakdown */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {letters.map((letter, index) => (
                  <div
                    key={index}
                    className="w-12 h-12 rounded-lg bg-white/50 flex items-center justify-center"
                  >
                    <span className="text-xl font-bold text-text-primary">
                      {letter.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={initializeGame}
                  className="bg-lavender hover:bg-purple-400 text-white font-bold py-3 px-8 rounded-full"
                >
                  Practice Again
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
