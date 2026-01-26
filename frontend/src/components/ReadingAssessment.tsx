export default function ReadingAssessment({
  onComplete,
  onSkip,
}: ReadingAssessmentProps) {
  const [phase, setPhase] = useState
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
  
  // WebGazer container ref - КРИТИЧНО: контейнер не должен удаляться
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
  }, [phase, startTimeRef.current]);

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
      
      // Переходим к калибровке БЕЗ перерисовки
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

  const handleCalibrationClick = async (event: React.MouseEvent) => {
    console.log(`📍 Calibration point ${calibrationIndex + 1} clicked`);
    
    // Записываем калибровочную точку
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    if (window.webgazer) {
      // Записываем несколько сэмплов для точности
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        window.webgazer.recordScreenPosition(x, y, 'click');
      }
      console.log(`✅ Recorded calibration at (${x.toFixed(0)}, ${y.toFixed(0)})`);
    }
    
    if (calibrationIndex < CALIBRATION_POINTS.length - 1) {
      setCalibrationIndex(prev => prev + 1);
    } else {
      console.log('✅ Calibration complete, starting reading...');
      
      // ВАЖНО: Скрываем элементы калибровки, но НЕ удаляем их
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

    // Скрываем UI элементы WebGazer
    if (window.webgazer) {
      window.webgazer.showPredictionPoints(false);
      window.webgazer.showFaceOverlay(false);
      window.webgazer.showFaceFeedbackBox(false);
      // Оставляем видео включенным!
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
    <div className="min-h-screen bg-gradient-to-br from-soft-blue to-mint p-8">
      {/* WebGazer container - ВСЕГДА в DOM */}
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
              className={`bg-soft-blue hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 ${
                isStarting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isStarting ? 'Starting...' : 'Start Assessment'}
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

        {/* Calibration Phase - используем opacity вместо условного рендеринга */}
        <div 
          className="fixed inset-0 z-40"
          style={{ 
            display: phase === 'calibration' ? 'block' : 'none',
            pointerEvents: phase === 'calibration' ? 'auto' : 'none'
          }}
        >
          <div className="text-center mb-8 absolute top-8 left-0 right-0">
            <p className="text-xl text-text-primary font-bold">
              Click on the red circle
            </p>
            <p className="text-text-secondary">
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