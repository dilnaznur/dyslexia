/**
 * WebGazer.js utilities for eye-tracking
 */

import { GazePoint, Fixation } from '@/types';

/**
 * Initialize WebGazer eye-tracking with camera permission check
 */
export async function initializeWebGazer(): Promise<void> {
  try {
    console.log('🎥 Starting WebGazer initialization...');
    
    if (!window.webgazer) {
      throw new Error('WebGazer not loaded');
    }

    // Check camera permission
    console.log('📹 Requesting camera permission...');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log('✅ Camera permission granted');
    stream.getTracks().forEach(track => track.stop()); // Release immediately

    // Initialize WebGazer
    console.log('⚙️ Configuring WebGazer...');
    await window.webgazer
      .setRegression('ridge')
      .setTracker('TFFacemesh')
      .showPredictionPoints(false)
      .showVideo(true)
      .showFaceOverlay(false)
      .showFaceFeedbackBox(false)
      .begin();

    // Wait for full initialization
    console.log('⏳ Waiting for WebGazer warmup...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ WebGazer initialized successfully');
  } catch (error) {
    console.error('❌ WebGazer initialization error:', error);
    throw new Error('Failed to initialize eye tracking. Please allow camera access.');
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

  console.log('👁️ Starting gaze tracking...');

  let gazeCount = 0;

  window.webgazer.setGazeListener((data, timestamp) => {
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

/**
 * Stop gaze tracking
 */
export function stopGazeTracking(): void {
  if (window.webgazer) {
    console.log('⏸️ Stopping gaze tracking...');
    window.webgazer.pause();
    window.webgazer.setGazeListener(() => {});
  }
}

/**
 * Cleanup and end WebGazer session
 */
/**
 * Cleanup and end WebGazer session
 */
export function cleanupWebGazer(): void {
  try {
    console.log('🧹 Starting WebGazer cleanup...');
    
    if (!window.webgazer) {
      console.log('⚠️ WebGazer not found, skipping cleanup');
      return;
    }

    // Stop tracking and clear listeners
    window.webgazer.pause();
    window.webgazer.setGazeListener(() => {});
    
    // Hide UI elements
    window.webgazer.showVideo(false);
    window.webgazer.showFaceOverlay(false);
    window.webgazer.showFaceFeedbackBox(false);
    window.webgazer.showPredictionPoints(false);

    // Clean up video streams FIRST
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

    // НЕ вызываем .end() - он вызывает ошибки DOM
    console.log('⏸️ WebGazer paused (skipping .end() to avoid errors)');

    // Manual cleanup of DOM elements
    cleanupWebGazerDOM();

    console.log('✅ WebGazer cleanup completed');
  } catch (err) {
    console.error('❌ Error during WebGazer cleanup:', err);
  }
}

/**
 * Remove WebGazer-created DOM elements
 */
function cleanupWebGazerDOM(): void {
  try {
    const selectors = [
      '#webgazerVideoFeed',
      '#webgazerFaceOverlay',
      '#webgazerFaceFeedbackBox',
      '#webgazerVideoCanvas',
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        try {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        } catch (err) {
          // Element already removed
        }
      });
    });

    console.log('✅ WebGazer DOM elements cleaned');
  } catch (err) {
    console.warn('⚠️ Error cleaning WebGazer DOM:', err);
  }
}

/**
 * Remove WebGazer-created DOM elements
 */
function cleanupWebGazerDOM(): void {
  try {
    // Remove WebGazer video elements
    const selectors = [
      '#webgazerVideoFeed',
      '#webgazerFaceOverlay',
      '#webgazerFaceFeedbackBox',
      '#webgazerVideoCanvas',
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        try {
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        } catch (err) {
          // Element might already be removed
        }
      });
    });

    // Remove any orphaned WebGazer elements
    document.querySelectorAll('video, canvas').forEach(element => {
      const style = element.getAttribute('style') || '';
      if (style.includes('position') && !element.id.startsWith('user-')) {
        try {
          if (element.tagName === 'VIDEO') {
            const video = element as HTMLVideoElement;
            const stream = video.srcObject as MediaStream;
            if (stream) {
              stream.getTracks().forEach(track => track.stop());
            }
            video.srcObject = null;
          }
          
          if (element.parentNode) {
            element.parentNode.removeChild(element);
          }
        } catch (err) {
          // Ignore errors
        }
      }
    });

  } catch (err) {
    console.warn('Error cleaning up WebGazer DOM:', err);
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