/**
 * Reading Assessment with Eye-Tracking Module
 * Uses WebGazer.js to track eye movements during reading
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Eye, CheckCircle, AlertCircle } from 'lucide-react';

// Type definitions
interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
}

interface ReadingMetrics {
  gaze_points: GazePoint[];
  text_length: number;
  reading_duration: number;
  reading_speed: number;
  fixation_count: number;
  avg_fixation_duration: number;
  regression_index: number;
  heatmap_data: { x: number; y: number; intensity: number }[];
}

interface Fixation {
  x: number;
  y: number;
  duration: number;
  startTime: number;
  endTime: number;
}

interface ReadingAssessmentProps {
  onComplete: (metrics: ReadingMetrics) => void;
  onSkip?: () => void;
}

// Constants
const READING_TEXT = `Once upon a time, there was a clever fox who lived in a beautiful forest. The fox loved to explore and find new adventures every day. One sunny morning, the fox discovered a sparkling stream with crystal clear water. Many colorful fish swam happily in the stream. The fox made friends with a wise old owl who lived in a tall oak tree. Together, they explored the magical forest and helped other animals. They found hidden treasures and solved interesting puzzles. The fox learned that friendship and kindness are the most valuable treasures of all.`;

const CALIBRATION_POINTS = [
  { x: 10, y: 10 },
  { x: 90, y: 10 },
  { x: 50, y: 50 },
  { x: 10, y: 90 },
  { x: 90, y: 90 },
];

// WebGazer utility functions
async function initializeWebGazer(): Promise<void> {
  try {
    console.log('🎥 Starting WebGazer initialization...');
    
    if (!window.webgazer) {
      throw new Error('WebGazer not loaded');
    }

    console.log('📹 Requesting camera permission...');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log('✅ Camera permission granted');
    stream.getTracks().forEach(track => track.stop());

    console.log('⚙️ Configuring WebGazer...');
    await window.webgazer
      .setRegression('ridge')
      .setTracker('TFFacemesh')
      .showPredictionPoints(true)
      .showVideo(true)
      .showFaceOverlay(false)
      .showFaceFeedbackBox(false)
      .begin();

    console.log('⏳ Waiting for WebGazer warmup...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ WebGazer initialized successfully');
  } catch (error) {
    console.error('❌ WebGazer initialization error:', error);
    throw new Error('Failed to initialize eye tracking. Please allow camera access.');
  }
}

function startGazeTracking(onGazeData: (data: GazePoint) => void): void {
  if (!window.webgazer) {
    throw new Error('WebGazer not initialized');
  }

  console.log('👁️ Starting gaze tracking...');
  let gazeCount = 0;

  window.webgazer.setGazeListener((data: any, timestamp: number) => {
    if (data && data.x && data.y) {
      gazeCount++;
      if (gazeCount % 30 === 0) {
        console.log(`👁️ Gaze data received: ${gazeCount} points`);
      }
      onGazeData({
        x: data.x,
        y: data.y,
        timestamp,
      });
    }
  });

  window.webgazer.resume();
  console.log('✅ Gaze tracking started');
}

function stopGazeTracking(): void {
  if (window.webgazer) {
    console.log('⏸️ Stopping gaze tracking...');
    window.webgazer.pause();
    window.webgazer.setGazeListener(() => {});
  }
}

function cleanupWebGazer(): void {
  try {
    console.log('🧹 Starting WebGazer cleanup...');
    
    if (!window.webgazer) {
      console.log('⚠️ WebGazer not found, skipping cleanup');
      return;
    }

    window.webgazer.pause();
    window.webgazer.setGazeListener(() => {});
    
    window.webgazer.showVideo(false);
    window.webgazer.showFaceOverlay(false);
    window.webgazer.showFaceFeedbackBox(false);
    window.webgazer.showPredictionPoints(false);

    console.log('📹 Stopping camera streams...');
    const webgazerVideos = document.querySelectorAll('video');
    webgazerVideos.forEach((video) => {
      try {
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log('✅ Stopped track:', track.kind);
          });
          video.srcObject = null;
        }
      } catch (err) {
        console.warn('⚠️ Error stopping video stream:', err);
      }
    });

    console.log('✅ WebGazer cleanup completed');
  } catch (err) {
    console.error('❌ Error during WebGazer cleanup:', err);
  }
}

function detectFixations(gazePoints: GazePoint[]): Fixation[] {
  const fixations: Fixation[] = [];
  const FIXATION_RADIUS = 50;
  const MIN_FIXATION_DURATION = 100;

  let i = 0;
  while (i < gazePoints.length) {
    const windowStart = i;
    let windowEnd = i;

    while (windowEnd < gazePoints.length - 1) {
      const windowPoints = gazePoints.slice(windowStart, windowEnd + 2);

      const centerX =
        windowPoints.reduce((sum, p) => sum + p.x, 0) / windowPoints.length;
      const centerY =
        windowPoints.reduce((sum, p) => sum + p.y, 0) / windowPoints.length;

      const maxDist = Math.max(
        ...windowPoints.map((p) =>
          Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2))
        )
      );

      if (maxDist > FIXATION_RADIUS) {
        break;
      }

      windowEnd++;
    }

    const duration =
      gazePoints[windowEnd].timestamp - gazePoints[windowStart].timestamp;

    if (duration >= MIN_FIXATION_DURATION) {
      const fixationPoints = gazePoints.slice(windowStart, windowEnd + 1);
      const avgX =
        fixationPoints.reduce((sum, p) => sum + p.x, 0) /
        fixationPoints.length;
      const avgY =
        fixationPoints.reduce((sum, p) => sum + p.y, 0) /
        fixationPoints.length;

      fixations.push({
        x: avgX,
        y: avgY,
        duration,
        startTime: fixationPoints[0].timestamp,
        endTime: fixationPoints[fixationPoints.length - 1].timestamp,
      });
    }

    i = windowEnd + 1;
  }

  return fixations;
}

function calculateReadingMetrics(
  gazePoints: GazePoint[],
  textLength: number,
  readingDuration: number
): {
  reading_speed: number;
  avg_fixation_duration: number;
  fixation_count: number;
  regression_index: number;
} {
  if (gazePoints.length < 10) {
    return {
      reading_speed: 0,
      avg_fixation_duration: 0,
      fixation_count: 0,
      regression_index: 0,
    };
  }

  const fixations = detectFixations(gazePoints);
  const reading_speed = (textLength / readingDuration) * 60;
  const avg_fixation_duration =
    fixations.reduce((sum, f) => sum + f.duration, 0) / fixations.length;

  let regressions = 0;
  for (let i = 1; i < fixations.length; i++) {
    if (fixations[i].x < fixations[i - 1].x - 50) {
      regressions++;
    }
  }
  const regression_index = regressions / fixations.length;

  return {
    reading_speed,
    avg_fixation_duration,
    fixation_count: fixations.length,
    regression_index,
  };
}

function generateHeatmapData(gazePoints: GazePoint[]): {
  x: number;
  y: number;
  intensity: number;
}[] {
  const gridSize = 30;
  const heatmapGrid: Map<string, number> = new Map();

  gazePoints.forEach((point) => {
    const gridX = Math.floor(point.x / gridSize);
    const gridY = Math.floor(point.y / gridSize);
    const key = `${gridX},${gridY}`;

    heatmapGrid.set(key, (heatmapGrid.get(key) || 0) + 1);
  });

  const maxIntensity = Math.max(...Array.from(heatmapGrid.values()));

  return Array.from(heatmapGrid.entries()).map(([key, count]) => {
    const [gridX, gridY] = key.split(',').map(Number);
    return {
      x: gridX * gridSize + gridSize / 2,
      y: gridY * gridSize + gridSize / 2,
      intensity: count / maxIntensity,
    };
  });
}

// Main Component
export default function ReadingAssessment({
  onComplete,
  onSkip,
}: ReadingAssessmentProps) {
  const [phase, setPhase] = useState<
    'intro' | 'calibration' | 'reading' | 'complete'
  >('intro');
  const [calibrationIndex, setCalibrationIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  
  const gazePointsRef = useRef<GazePoint[]>([]);
  const startTimeRef = useRef<number>(0);
  const isWebGazerInitialized = useRef(false);
  const hasCompletedRef = useRef(false);
  const isInitializing = useRef(false);
  const webgazerContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      console.log('🔄 Component unmounting...');
      if (isWebGazerInitialized.current && !hasCompletedRef.current) {
        console.log('🧹 Cleaning up WebGazer on unmount');
        cleanupWebGazer();
        isWebGazerInitialized.current = false;
      }
    };
  }, []);

  useEffect(() => {
    if (phase === 'reading' && startTimeRef.current > 0) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const expectedDuration = 120000;
        const newProgress = Math.min((elapsed / expectedDuration) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          handleReadingComplete();
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [phase]);

  const handleStart = async () => {
    if (isInitializing.current || isWebGazerInitialized.current || isStarting) {
      console.log('⚠️ Already starting or started');
      return;
    }

    try {
      isInitializing.current = true;
      setIsStarting(true);
      setError(null);
      console.log('🚀 User clicked Start Assessment');
      
      await initializeWebGazer();
      isWebGazerInitialized.current = true;
      
      setPhase('calibration');
      console.log('✅ Moving to calibration phase');
    } catch (err) {
      setError(
        'Failed to initialize eye tracking. Please ensure camera access is granted.'
      );
      console.error('❌ WebGazer initialization error:', err);
      setIsStarting(false);
    } finally {
      isInitializing.current = false;
    }
  };

  const handleCalibrationClick = async () => {
    console.log(`📍 Calibration point ${calibrationIndex + 1} clicked`);
    
    // Give WebGazer time to register the click
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (calibrationIndex < CALIBRATION_POINTS.length - 1) {
      setCalibrationIndex(prev => prev + 1);
    } else {
      console.log('✅ Calibration complete, starting reading...');
      
      setTimeout(() => {
        setPhase('reading');
        startReading();
      }, 500);
    }
  };

  const startReading = () => {
    if (!isWebGazerInitialized.current) {
      console.error('❌ WebGazer not initialized, cannot start reading');
      return;
    }

    console.log('📖 Starting reading phase');
    const startTime = Date.now();
    startTimeRef.current = startTime;
    gazePointsRef.current = [];

    if (window.webgazer) {
      window.webgazer.showPredictionPoints(false);
      window.webgazer.showFaceOverlay(false);
      window.webgazer.showFaceFeedbackBox(false);
    }

    startGazeTracking((gazeData) => {
      if (gazePointsRef.current.length < 10) {
        console.log(`👁️ Gaze point ${gazePointsRef.current.length + 1}:`, 
          gazeData.x.toFixed(2), gazeData.y.toFixed(2));
      }
      gazePointsRef.current.push(gazeData);
    });

    setTimeout(() => {
      console.log(`📊 Check: ${gazePointsRef.current.length} points collected so far`);
      if (gazePointsRef.current.length === 0) {
        console.warn('⚠️ No gaze data yet - WebGazer may need more time or recalibration');
      }
    }, 2000);
  };

  const handleReadingComplete = () => {
    if (hasCompletedRef.current) {
      console.log('⚠️ Already completed, skipping');
      return;
    }
    hasCompletedRef.current = true;

    console.log('✅ Reading complete, processing results...');
    stopGazeTracking();

    const endTime = Date.now();
    const duration = (endTime - startTimeRef.current) / 1000;
    const wordCount = READING_TEXT.split(/\s+/).length;

    console.log(`📊 Collected ${gazePointsRef.current.length} gaze points over ${duration}s`);

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

    setTimeout(() => {
      console.log('🧹 Cleaning up WebGazer after completion');
      if (isWebGazerInitialized.current) {
        cleanupWebGazer();
        isWebGazerInitialized.current = false;
      }
      onComplete(metrics);
    }, 1000);
  };

  const currentCalibrationPoint =
    calibrationIndex < CALIBRATION_POINTS.length
      ? CALIBRATION_POINTS[calibrationIndex]
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-8">
      <div 
        ref={webgazerContainerRef}
        className="fixed top-4 right-4 z-50"
        style={{ 
          display: phase === 'intro' || phase === 'complete' ? 'none' : 'block' 
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {phase === 'intro' && (
          <div className="glass-card p-8 text-center">
            <Eye className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Reading Assessment with Eye Tracking
            </h2>
            <p className="text-lg mb-6 text-gray-600 leading-relaxed">
              We'll track your eye movements while you read a short story. This
              helps us understand your reading patterns.
            </p>
            <div className="bg-yellow-100 p-4 rounded-lg mb-6">
              <p className="text-base">
                <strong>What to do:</strong> First, you'll calibrate the eye
                tracker by clicking on dots that appear on the screen. Then, read the story
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
              disabled={isStarting}
              className={`bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 ${
                isStarting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isStarting ? 'Starting...' : 'Start Assessment'}
            </button>
            {onSkip && (
              <button
                onClick={onSkip}
                className="ml-4 text-gray-600 hover:text-gray-800 underline"
              >
                Skip this step
              </button>
            )}
          </div>
        )}

        <div 
          className="fixed inset-0 z-40"
          style={{ 
            display: phase === 'calibration' ? 'block' : 'none',
            pointerEvents: phase === 'calibration' ? 'auto' : 'none'
          }}
        >
          <div className="text-center mb-8 absolute top-8 left-0 right-0">
            <p className="text-xl text-gray-800 font-bold">
              Click on the red circle
            </p>
            <p className="text-gray-600">
              Point {calibrationIndex + 1} of {CALIBRATION_POINTS.length}
            </p>
          </div>
          {currentCalibrationPoint && (
            <motion.button
              key={calibrationIndex}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={handleCalibrationClick}
              className="absolute w-16 h-16 bg-red-500 rounded-full cursor-pointer hover:bg-red-600 transition-colors shadow-lg flex items-center justify-center text-white font-bold"
              style={{
                left: `${currentCalibrationPoint.x}%`,
                top: `${currentCalibrationPoint.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {calibrationIndex + 1}
            </motion.button>
          )}
        </div>

        {phase === 'reading' && (
          <div className="glass-card p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Reading Progress</span>
                <span className="text-gray-800 font-bold">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  className="bg-green-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-inner">
              <p className="text-xl leading-relaxed text-gray-800">
                {READING_TEXT}
              </p>
            </div>

            <button
              onClick={handleReadingComplete}
              className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105"
            >
              I'm Done Reading
            </button>
          </div>
        )}

        {phase === 'complete' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 text-center"
          >
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Great Job! 🎉
            </h2>
            <p className="text-lg text-gray-600">
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