/**
 * WebGazer.js utilities for eye-tracking
 */
import { GazePoint, Fixation } from '@/types';

/**
 * Initialize WebGazer eye-tracking
 */
export async function initializeWebGazer(): Promise<void> {
  try {
    if (!window.webgazer) {
      throw new Error('WebGazer not loaded');
    }

    await window.webgazer
      .setRegression('ridge') // Use ridge regression
      .setTracker('TFFacemesh') // Use TensorFlow FaceMesh tracker
      .begin();

    // Configure WebGazer UI
    window.webgazer
      .showPredictionPoints(false) // Hide prediction dots
      .showVideo(true) // Show webcam feed during calibration
      .showFaceOverlay(false)
      .showFaceFeedbackBox(false)
      .applyKalmanFilter(true); // Apply smoothing

    console.log('WebGazer initialized successfully');
  } catch (error) {
    console.error('WebGazer initialization error:', error);
    throw error;
  }
}

/**
 * Start gaze data collection
 */
export function startGazeTracking(
  onGazeData: (data: GazePoint) => void
): void {
  if (!window.webgazer) {
    throw new Error('WebGazer not initialized');
  }

  window.webgazer.setGazeListener((data, timestamp) => {
    if (data && data.x && data.y) {
      onGazeData({
        x: data.x,
        y: data.y,
        timestamp,
      });
    }
  });

  window.webgazer.resume();
}

/**
 * Stop gaze tracking
 */
export function stopGazeTracking(): void {
  if (window.webgazer) {
    window.webgazer.pause();
    window.webgazer.setGazeListener(() => {});
  }
}

/**
 * Cleanup and end WebGazer session
 */
export function cleanupWebGazer(): void {
  if (window.webgazer) {
    window.webgazer.end();
    window.webgazer.clearData();
  }
}

/**
 * Calculate reading metrics from gaze points
 */
export function calculateReadingMetrics(
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

  // Detect fixations
  const fixations = detectFixations(gazePoints);

  // Calculate reading speed (words per minute)
  const reading_speed = (textLength / readingDuration) * 60;

  // Calculate average fixation duration
  const avg_fixation_duration =
    fixations.reduce((sum, f) => sum + f.duration, 0) / fixations.length;

  // Calculate regression index (backward movements)
  let regressions = 0;
  for (let i = 1; i < fixations.length; i++) {
    if (fixations[i].x < fixations[i - 1].x - 50) {
      // Moved significantly backward
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

/**
 * Detect fixations from raw gaze points
 */
function detectFixations(gazePoints: GazePoint[]): Fixation[] {
  const fixations: Fixation[] = [];
  const FIXATION_RADIUS = 50; // pixels
  const MIN_FIXATION_DURATION = 100; // milliseconds

  let i = 0;
  while (i < gazePoints.length) {
    const windowStart = i;
    let windowEnd = i;

    // Expand window while points are close together
    while (windowEnd < gazePoints.length - 1) {
      const windowPoints = gazePoints.slice(windowStart, windowEnd + 2);

      // Check if all points are within radius
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

    // Check duration
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

/**
 * Generate heatmap data from gaze points
 */
export function generateHeatmapData(gazePoints: GazePoint[]): {
  x: number;
  y: number;
  intensity: number;
}[] {
  const gridSize = 30; // Grid cell size in pixels
  const heatmapGrid: Map<string, number> = new Map();

  // Aggregate gaze points into grid cells
  gazePoints.forEach((point) => {
    const gridX = Math.floor(point.x / gridSize);
    const gridY = Math.floor(point.y / gridSize);
    const key = `${gridX},${gridY}`;

    heatmapGrid.set(key, (heatmapGrid.get(key) || 0) + 1);
  });

  // Convert to array with normalized intensities
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
