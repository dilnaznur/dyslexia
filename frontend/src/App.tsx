/**
 * Main App Component
 * Orchestrates the multi-stage dyslexia assessment workflow
 * Now includes routing for the exercises section
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Eye, Pencil, MessageCircle, BarChart3, Gamepad2 } from 'lucide-react';
import { DiagnosisProvider, useDiagnosis } from '@/context/DiagnosisProvider';
import ReadingAssessment from '@/components/ReadingAssessment';
import WritingAssessment from '@/components/WritingAssessment';
import AIChatbot from '@/components/AIChatbot';
import Dashboard from '@/components/Dashboard';
import ExerciseHub from '@/components/exercises/ExerciseHub';
import { ReadingMetrics, WritingAnalysis, ChatbotAnalysis } from '@/types';

type AssessmentStep = 'welcome' | 'reading' | 'writing' | 'chatbot' | 'processing' | 'dashboard';

function AppContent() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<AssessmentStep>('welcome');
  const {
    setReadingData,
    setWritingData,
    setChatbotData,
    processBackendPrediction,
    calculateFinalScore,
  } = useDiagnosis();

  // Handle reading assessment completion
  const handleReadingComplete = async (metrics: ReadingMetrics) => {
    setReadingData(metrics);
    setCurrentStep('writing');
  };

  // Handle writing assessment completion
  const handleWritingComplete = (analysis: WritingAnalysis) => {
    setWritingData(analysis);
    setCurrentStep('chatbot');
  };

  // Handle chatbot assessment completion
  const handleChatbotComplete = async (analysis: ChatbotAnalysis) => {
    setChatbotData(analysis);
    setCurrentStep('processing');
  };

  // Process all data when all assessments are complete
  useEffect(() => {
    if (currentStep === 'processing') {
      processAllData();
    }
  }, [currentStep]);

  const processAllData = async () => {
    try {
      // Get backend ML prediction
      await processBackendPrediction();

      // Wait a bit for dramatic effect
      await new Promise((resolve) => setTimeout(resolve, 1500));



      // Navigate to dashboard
      setCurrentStep('dashboard');
    } catch (error) {
      console.error('Failed to process assessment data:', error);
      // Still show dashboard even if backend fails
      calculateFinalScore();
      setCurrentStep('dashboard');
    }
  };

  const steps = [
    { id: 'reading', label: 'Reading', icon: Eye, color: 'soft-blue' },
    { id: 'writing', label: 'Writing', icon: Pencil, color: 'lavender' },
    { id: 'chatbot', label: 'Chat', icon: MessageCircle, color: 'pale-yellow' },
    { id: 'dashboard', label: 'Results', icon: BarChart3, color: 'mint' },
  ];

  const getCurrentStepIndex = () => {
    switch (currentStep) {
      case 'reading':
        return 0;
      case 'writing':
        return 1;
      case 'chatbot':
        return 2;
      case 'processing':
      case 'dashboard':
        return 3;
      default:
        return -1;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Progress Steps (hidden on welcome and dashboard) */}
      {currentStep !== 'welcome' && currentStep !== 'dashboard' && (
        <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-md z-50">
          <div className="max-w-4xl mx-auto px-8 py-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const isActive = index === getCurrentStepIndex();
                const isCompleted = index < getCurrentStepIndex();
                const Icon = step.icon;

                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <motion.div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-mint'
                            : isActive
                            ? 'bg-soft-blue'
                            : 'bg-gray-200'
                        }`}
                        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            isCompleted || isActive
                              ? 'text-white'
                              : 'text-gray-400'
                          }`}
                        />
                      </motion.div>
                      <span
                        className={`text-sm mt-1 ${
                          isActive ? 'text-text-primary font-semibold' : 'text-text-secondary'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`h-1 flex-1 mx-2 ${
                          isCompleted ? 'bg-mint' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {/* Welcome Screen */}
        {currentStep === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-mint via-soft-blue to-lavender flex items-center justify-center p-8"
          >
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.8 }}
                className="mb-8"
              >
                <Brain className="w-24 h-24 mx-auto text-white drop-shadow-lg" />
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-6xl font-bold text-white mb-4 drop-shadow-md"
              >
                MindStep
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-2xl text-white/90 mb-12 leading-relaxed"
              >
                Early Dyslexia Detection Platform
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="glass-card p-8 mb-8 text-left max-w-2xl mx-auto"
              >
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  What to Expect
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-soft-blue rounded-full flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        Reading Assessment
                      </h3>
                      <p className="text-text-secondary">
                        Read a short story while we track your eye movements (2-3 min)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-lavender rounded-full flex items-center justify-center flex-shrink-0">
                      <Pencil className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        Writing Assessment
                      </h3>
                      <p className="text-text-secondary">
                        Write a few simple words using your mouse or touchscreen (2-3 min)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-pale-yellow rounded-full flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        Chat Assessment
                      </h3>
                      <p className="text-text-secondary">
                        Have a friendly conversation with our AI assistant (3-5 min)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-mint rounded-full flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">
                        Get Your Results
                      </h3>
                      <p className="text-text-secondary">
                        Receive detailed insights and personalized recommendations
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentStep('reading')}
                  className="bg-white hover:bg-gray-100 text-text-primary font-bold text-xl py-4 px-12 rounded-full shadow-lg transition-all"
                >
                  Begin Assessment
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/exercises')}
                  className="bg-white/30 hover:bg-white/50 text-white font-bold text-lg py-3 px-8 rounded-full shadow-lg transition-all flex items-center gap-2 border-2 border-white/50"
                >
                  <Gamepad2 className="w-5 h-5" />
                  Practice Exercises
                </motion.button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-white/70 text-sm"
              >
                Total time: ~10-15 minutes • 100% confidential • Suitable for ages 5-10
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Reading Assessment */}
        {currentStep === 'reading' && (
          <motion.div
            key="reading"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <ReadingAssessment onComplete={handleReadingComplete} />
          </motion.div>
        )}

        {/* Writing Assessment */}
        {currentStep === 'writing' && (
          <motion.div
            key="writing"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <WritingAssessment onComplete={handleWritingComplete} />
          </motion.div>
        )}

        {/* Chatbot Assessment */}
        {currentStep === 'chatbot' && (
          <motion.div
            key="chatbot"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
          >
            <AIChatbot onComplete={handleChatbotComplete} />
          </motion.div>
        )}

        {/* Processing */}
        {currentStep === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-mint to-soft-blue flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                animate={{
                  rotate: 360,
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 1, repeat: Infinity },
                }}
                className="inline-block mb-6"
              >
                <Brain className="w-20 h-20 text-white" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Analyzing Your Results...
              </h2>
              <p className="text-white/80 text-lg">
                Our AI is processing your assessment data
              </p>
              <div className="flex gap-2 justify-center mt-6">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 bg-white rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Dashboard */}
        {currentStep === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard />
          </motion.div>
        )}
      </AnimatePresence>

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppContent />} />
      <Route path="/exercises" element={<ExerciseHub />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <DiagnosisProvider>
        <AppRoutes />
      </DiagnosisProvider>
    </BrowserRouter>
  );
}
