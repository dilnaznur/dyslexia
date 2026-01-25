/**
 * Reading Assessment with Eye-Tracking Module
 * Uses WebGazer.js to track eye movements during reading
 */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle, AlertCircle } from 'lucide-react';
import {
  initializeWebGazer,
  startGazeTracking,
  stopGazeTracking,
  cleanupWebGazer,
  calculateReadingMetrics,
  generateHeatmapData,
} from '@/lib/webgazer';
import { GazePoint, ReadingMetrics } from '@/types';

interface ReadingAssessmentProps {
  onComplete: (metrics: ReadingMetrics) => void;
  onSkip?: () => void;
}

const READING_TEXT = `Once upon a time, there was a clever fox who lived in a beautiful forest. The fox loved to explore and find new adventures every day. One sunny morning, the fox discovered a sparkling stream with crystal clear water. Many colorful fish swam happily in the stream. The fox made friends with a wise old owl who lived in a tall oak tree. Together, they explored the magical forest and helped other animals. They found hidden treasures and solved interesting puzzles. The fox learned that friendship and kindness are the most valuable treasures of all.`;

const CALIBRATION_POINTS = [
  { x: 10, y: 10 },
  { x: 50, y: 10 },
  { x: 90, y: 10 },
  { x: 10, y: 50 },
  { x: 50, y: 50 },
  { x: 90, y: 50 },
  { x: 10, y: 90 },
  { x: 50, y: 90 },
  { x: 90, y: 90 },
];

export default function ReadingAssessment({
  onComplete,
  onSkip,
}: ReadingAssessmentProps) {
  const [phase, setPhase] = useState<
    'intro' | 'calibration' | 'reading' | 'complete'
  >('intro');
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [gazePoints, setGazePoints] = useState<GazePoint[]>([]);
  const [readingStartTime, setReadingStartTime] = useState<number>(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const gazePointsRef = useRef<GazePoint[]>([]);
  const startTimeRef = useRef<number>(0);
  const isMountedRef = useRef(true);

  // Обновите useEffect для очистки
  useEffect(() => {
    isMountedRef.current = true;
    
    initializeWebGazer().catch((err) => console.error(err));
  
    return () => {
      isMountedRef.current = false;
      // Даем небольшую задержку для корректной очистки
      setTimeout(() => {
        cleanupWebGazer();
      }, 100);
    };
  }, []);


  // Handle calibration
  useEffect(() => {
    if (phase === 'calibration' && calibrationIndex < CALIBRATION_POINTS.length) {
      const timer = setTimeout(() => {
        setCalibrationIndex((prev) => prev + 1);
      }, 2000); // 2 seconds per calibration point

      return () => clearTimeout(timer);
    } else if (
      phase === 'calibration' &&
      calibrationIndex >= CALIBRATION_POINTS.length
    ) {
      // Calibration complete, start reading
      setPhase('reading');
      startReading();
    }
  }, [phase, calibrationIndex]);

  // Update progress during reading
  useEffect(() => {
    if (phase === 'reading' && readingStartTime > 0) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - readingStartTime;
        const expectedDuration = 120000; // 2 minutes
        const newProgress = Math.min((elapsed / expectedDuration) * 100, 100);
        setProgress(newProgress);

        // Auto-complete after 2 minutes
        if (newProgress >= 100) {
          handleReadingComplete();
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [phase, readingStartTime]);

  const handleStart = async () => {
    try {
      setError(null);
      await initializeWebGazer();
      setPhase('calibration');
    } catch (err) {
      setError(
        'Failed to initialize eye tracking. Please ensure camera access is granted.'
      );
      console.error('WebGazer initialization error:', err);
    }
  };

  const startReading = () => {
    const startTime = Date.now();
    setReadingStartTime(startTime);
    startTimeRef.current = startTime;
    gazePointsRef.current = [];

    // Start collecting gaze data
    startGazeTracking((gazeData) => {
      gazePointsRef.current.push(gazeData);
    });
  };

  const handleReadingComplete = () => {
    stopGazeTracking();
  
    const endTime = Date.now();
    const duration = (endTime - startTimeRef.current) / 1000;
    const wordCount = READING_TEXT.split(/\s+/).length;
  
    const calculatedMetrics = calculateReadingMetrics(
      gazePointsRef.current,
      wordCount,
      duration
    );
  
    const heatmapData = generateHeatmapData(gazePointsRef.current);
  
    const metrics: ReadingMetrics = {
      gaze_points: gazePointsRef.current,
      text_length: wordCount,
      reading_duration: duration,
      reading_speed: calculatedMetrics.reading_speed,
      fixation_count: calculatedMetrics.fixation_count,
      avg_fixation_duration: calculatedMetrics.avg_fixation_duration,
      regression_index: calculatedMetrics.regression_index,
      heatmap_data: heatmapData,
    };
  
    setPhase('complete');
    
    // Очищаем WebGazer перед переходом
    setTimeout(() => {
      cleanupWebGazer();
      onComplete(metrics);
    }, 500);
  };

  const currentCalibrationPoint =
    calibrationIndex < CALIBRATION_POINTS.length
      ? CALIBRATION_POINTS[calibrationIndex]
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-soft-blue to-mint p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Intro Phase */}
        {phase === 'intro' && (
          <div className="glass-card p-8 text-center">
            <Eye className="w-16 h-16 mx-auto mb-4 text-soft-blue" />
            <h2 className="text-2xl font-bold mb-4 text-text-primary">
              Reading Assessment with Eye Tracking
            </h2>
            <p className="text-lg mb-6 text-text-secondary leading-relaxed">
              We'll track your eye movements while you read a short story. This
              helps us understand your reading patterns.
            </p>
            <div className="bg-pale-yellow p-4 rounded-lg mb-6">
              <p className="text-base">
                <strong>What to do:</strong> First, we'll calibrate the eye
                tracker by looking at dots on the screen. Then, read the story
                at your normal pace.
              </p>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <AlertCircle className="inline mr-2" />
                {error}
              </div>
            )}
            <button
              onClick={handleStart}
              className="bg-soft-blue hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105"
            >
              Start Assessment
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="ml-4 text-text-secondary hover:text-text-primary underline"
              >
                Skip this step
              </button>
            )}
          </div>
        )}

        {/* Calibration Phase */}
        {phase === 'calibration' && currentCalibrationPoint && (
          <div className="relative h-screen">
            <div className="text-center mb-8">
              <p className="text-xl text-text-primary font-bold">
                Look at the red circle and follow it with your eyes
              </p>
              <p className="text-text-secondary">
                Calibration: {calibrationIndex + 1} of{' '}
                {CALIBRATION_POINTS.length}
              </p>
            </div>
            <motion.div
              key={calibrationIndex}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute w-8 h-8 bg-red-500 rounded-full"
              style={{
                left: `${currentCalibrationPoint.x}%`,
                top: `${currentCalibrationPoint.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        )}

        {/* Reading Phase */}
        {phase === 'reading' && (
          <div className="glass-card p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-text-secondary">Reading Progress</span>
                <span className="text-text-primary font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-mint h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-inner">
              <p className="text-xl leading-relaxed text-text-primary">
                {READING_TEXT}
              </p>
            </div>

            <button
              onClick={handleReadingComplete}
              className="mt-6 w-full bg-mint hover:bg-green-400 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105"
            >
              I'm Done Reading
            </button>
          </div>
        )}

        {/* Complete Phase */}
        {phase === 'complete' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 text-center"
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-4 text-text-primary">
              Great Job! 🎉
            </h2>
            <p className="text-lg text-text-secondary">
              Reading assessment complete. Analyzing your eye movements...
            </p>
          </motion.div>
        )}
      </motion.div>

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
