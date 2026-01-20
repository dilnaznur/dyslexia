/**
 * Writing Assessment with Handwriting Analysis
 * Canvas-based drawing + Gemini Vision API analysis
 */
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Undo, Trash2, Send, Loader } from 'lucide-react';
import { analyzeHandwriting } from '@/lib/gemini';
import { WritingAnalysis, Stroke } from '@/types';

interface WritingAssessmentProps {
  onComplete: (analysis: WritingAnalysis) => void;
  onSkip?: () => void;
}

const WRITING_PROMPTS = [
  'Write your name',
  'Copy this word: butterfly',
  'Write: The quick brown fox',
];

export default function WritingAssessment({
  onComplete,
  onSkip,
}: WritingAssessmentProps) {
  const [phase, setPhase] = useState<'intro' | 'drawing' | 'analyzing' | 'complete'>('intro');
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentStrokeRef = useRef<{ x: number; y: number; timestamp: number }[]>([]);
  const strokeStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (phase === 'drawing' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Configure drawing context
        ctx.strokeStyle = '#2C3E50';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Redraw all strokes
        redrawCanvas();
      }
    }
  }, [phase, strokes]);

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    });
  };

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    let clientX: number;
    let clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      timestamp: Date.now(),
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    if (!point) return;

    setIsDrawing(true);
    currentStrokeRef.current = [point];
    strokeStartTimeRef.current = Date.now();

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const point = getCanvasPoint(e);
    if (!point) return;

    currentStrokeRef.current.push(point);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);

    if (currentStrokeRef.current.length > 0) {
      const newStroke: Stroke = {
        points: currentStrokeRef.current,
        startTime: strokeStartTimeRef.current,
        endTime: Date.now(),
      };

      setStrokes((prev) => [...prev, newStroke]);
      currentStrokeRef.current = [];
    }
  };

  const handleUndo = () => {
    if (strokes.length === 0) return;
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSubmit = async () => {
    if (strokes.length === 0) {
      alert('Please write something before submitting.');
      return;
    }

    setAnalyzing(true);
    setPhase('analyzing');

    try {
      // Convert canvas to base64 image
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not found');

      const imageData = canvas.toDataURL('image/png');

      // Analyze with Gemini Vision
      const geminiResult = await analyzeHandwriting(imageData);

      // Calculate stroke metrics
      const avgStrokeSpeed = strokes.reduce((sum, stroke) => {
        const duration = (stroke.endTime - stroke.startTime) / 1000; // seconds
        const distance = calculateStrokeDistance(stroke.points);
        return sum + distance / duration;
      }, 0) / strokes.length;

      // Calculate pressure variance (simplified - based on point density)
      const pressureVariance = calculatePressureVariance(strokes);

      const analysis: WritingAnalysis = {
        gemini_response: geminiResult,
        stroke_count: strokes.length,
        avg_stroke_speed: avgStrokeSpeed,
        pressure_variance: pressureVariance,
        image_data: imageData,
      };

      setPhase('complete');
      onComplete(analysis);
    } catch (error) {
      console.error('Handwriting analysis error:', error);
      alert('Analysis failed. Please try again.');
      setPhase('drawing');
    } finally {
      setAnalyzing(false);
    }
  };

  const calculateStrokeDistance = (points: { x: number; y: number }[]) => {
    let distance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      distance += Math.sqrt(dx * dx + dy * dy);
    }
    return distance;
  };

  const calculatePressureVariance = (strokes: Stroke[]) => {
    // Simplified: Use point density as proxy for pressure
    const densities = strokes.map((stroke) => {
      const duration = (stroke.endTime - stroke.startTime) / 1000;
      return stroke.points.length / duration;
    });

    const mean = densities.reduce((a, b) => a + b, 0) / densities.length;
    const variance =
      densities.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) /
      densities.length;

    return variance;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender to-peach p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* Intro Phase */}
        {phase === 'intro' && (
          <div className="glass-card p-8 text-center">
            <Pencil className="w-16 h-16 mx-auto mb-4 text-lavender" />
            <h2 className="text-2xl font-bold mb-4 text-text-primary">
              Handwriting Assessment
            </h2>
            <p className="text-lg mb-6 text-text-secondary leading-relaxed">
              We'll ask you to write a few simple words. This helps us analyze
              your handwriting patterns.
            </p>
            <div className="bg-pale-yellow p-4 rounded-lg mb-6">
              <p className="text-base">
                <strong>What to do:</strong> Use your mouse or finger (on
                touchscreen) to write on the canvas. Take your time and write
                naturally.
              </p>
            </div>
            <button
              onClick={() => setPhase('drawing')}
              className="bg-lavender hover:bg-purple-400 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105"
            >
              Start Writing
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

        {/* Drawing Phase */}
        {phase === 'drawing' && (
          <div className="glass-card p-8">
            <h3 className="text-xl font-bold mb-4 text-center text-text-primary">
              {WRITING_PROMPTS[currentPromptIndex]}
            </h3>

            <div className="bg-white rounded-lg p-4 mb-4 border-4 border-dashed border-gray-300">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-96 cursor-crosshair touch-none"
                style={{ touchAction: 'none' }}
              />
            </div>

            <div className="flex gap-4 justify-center mb-4">
              <button
                onClick={handleUndo}
                disabled={strokes.length === 0}
                className="flex items-center gap-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-800 font-bold py-2 px-6 rounded-full transition"
              >
                <Undo className="w-5 h-5" />
                Undo
              </button>

              <button
                onClick={handleClear}
                disabled={strokes.length === 0}
                className="flex items-center gap-2 bg-red-300 hover:bg-red-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-800 font-bold py-2 px-6 rounded-full transition"
              >
                <Trash2 className="w-5 h-5" />
                Clear
              </button>

              <button
                onClick={handleSubmit}
                disabled={strokes.length === 0 || analyzing}
                className="flex items-center gap-2 bg-mint hover:bg-green-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-full transition"
              >
                <Send className="w-5 h-5" />
                Submit
              </button>
            </div>

            <p className="text-center text-text-secondary text-sm">
              Strokes recorded: {strokes.length}
            </p>
          </div>
        )}

        {/* Analyzing Phase */}
        {phase === 'analyzing' && (
          <div className="glass-card p-8 text-center">
            <Loader className="w-16 h-16 mx-auto mb-4 text-lavender animate-spin" />
            <h2 className="text-2xl font-bold mb-4 text-text-primary">
              Analyzing Handwriting...
            </h2>
            <p className="text-lg text-text-secondary">
              Using AI to analyze your handwriting patterns.
            </p>
          </div>
        )}

        {/* Complete Phase */}
        {phase === 'complete' && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl mb-4"
            >
              ✓
            </motion.div>
            <h2 className="text-2xl font-bold mb-4 text-text-primary">
              Analysis Complete! 🎨
            </h2>
            <p className="text-lg text-text-secondary">
              Great handwriting! Moving to the next assessment...
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
