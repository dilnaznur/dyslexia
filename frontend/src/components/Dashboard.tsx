/**
 * Dashboard Component
 * Displays comprehensive dyslexia assessment results with visualizations
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Download,
  Book,
  Pencil,
  Brain,
} from 'lucide-react';
import { useDiagnosis } from '@/context/DiagnosisProvider';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const { state } = useDiagnosis();
  const [countedScore, setCountedScore] = useState(0);

  // Count-up animation for risk score
  useEffect(() => {
    if (state.final_score !== null) {
      let start = 0;
      const end = state.final_score;
      const duration = 2000; // 2 seconds
      const increment = end / (duration / 16); // 60fps

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCountedScore(end);
          clearInterval(timer);

          // Trigger confetti for low risk
          if (end < 40) {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
            });
          }
        } else {
          setCountedScore(start);
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [state.final_score]);

  if (!state.final_score || !state.combined_explanation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint to-soft-blue flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            <Brain className="w-16 h-16 text-white" />
          </motion.div>
          <p className="mt-4 text-xl text-white">Analyzing results...</p>
        </div>
      </div>
    );
  }

  const riskColor =
    state.final_classification === 'Low Risk'
      ? 'bg-green-500'
      : state.final_classification === 'Moderate Risk'
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const riskTextColor =
    state.final_classification === 'Low Risk'
      ? 'text-green-600'
      : state.final_classification === 'Moderate Risk'
      ? 'text-yellow-600'
      : 'text-red-600';

  // Prepare radar chart data
  const radarData = [
    {
      metric: 'Reading',
      value: state.backend_prediction
        ? 100 - state.backend_prediction.risk_score
        : 50,
      fullMark: 100,
    },
    {
      metric: 'Eye Tracking',
      value: state.reading_data?.regression_index
        ? (1 - state.reading_data.regression_index) * 100
        : 50,
      fullMark: 100,
    },
    {
      metric: 'Handwriting',
      value: state.writing_data
        ? state.writing_data.gemini_response.overall_risk === 'Low'
          ? 80
          : state.writing_data.gemini_response.overall_risk === 'Moderate'
          ? 50
          : 20
        : 50,
      fullMark: 100,
    },
    {
      metric: 'Memory',
      value: state.chatbot_data ? state.chatbot_data.memory_score * 10 : 50,
      fullMark: 100,
    },
    {
      metric: 'Attention',
      value: state.chatbot_data ? state.chatbot_data.attention_score * 10 : 50,
      fullMark: 100,
    },
  ];

  // Prepare feature importance data
  const featureImportanceData = state.backend_prediction
    ? [
        {
          name: 'Fixation Duration',
          value: parseFloat(
            (state.backend_prediction.explanation.feature_importance
              .mean_fixation_duration / 500).toFixed(2)
          ),
        },
        {
          name: 'Entropy',
          value: parseFloat(
            (state.backend_prediction.explanation.feature_importance
              .entropy_fixation_duration / 3).toFixed(2)
          ),
        },
        {
          name: 'Autocorrelation',
          value: Math.abs(
            parseFloat(
              (state.backend_prediction.explanation.feature_importance
                .autocorrelation * 2).toFixed(2)
            )
          ),
        },
        {
          name: 'TVI Score',
          value: parseFloat(
            (state.backend_prediction.explanation.feature_importance
              .weighted_tvi_score / 15).toFixed(2)
          ),
        },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint to-soft-blue p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Assessment Results
          </h1>
          <p className="text-white/80 text-lg">
            Comprehensive Dyslexia Screening Report
          </p>
        </motion.div>

        {/* Risk Score Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 mb-8 text-center"
        >
          <h2 className="text-2xl font-bold text-text-primary mb-6">
            Overall Risk Assessment
          </h2>

          {/* Circular Gauge */}
          <div className="relative w-48 h-48 mx-auto mb-6">
            <svg className="transform -rotate-90" viewBox="0 0 200 200">
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="20"
              />
              {/* Progress circle */}
              <motion.circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={
                  state.final_classification === 'Low Risk'
                    ? '#4CAF50'
                    : state.final_classification === 'Moderate Risk'
                    ? '#FF9800'
                    : '#F44336'
                }
                strokeWidth="20"
                strokeDasharray={`${(countedScore / 100) * 502.4} 502.4`}
                initial={{ strokeDasharray: '0 502.4' }}
                animate={{
                  strokeDasharray: `${(countedScore / 100) * 502.4} 502.4`,
                }}
                transition={{ duration: 2, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-bold text-text-primary">
                {Math.round(countedScore)}
              </span>
              <span className="text-sm text-text-secondary">Risk Score</span>
            </div>
          </div>

          <div className={`inline-block px-6 py-3 rounded-full ${riskColor}`}>
            <span className="text-white font-bold text-xl">
              {state.final_classification}
            </span>
          </div>

          <p className="mt-4 text-text-secondary">
            Confidence: {(state.combined_explanation.confidence * 100).toFixed(1)}%
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Cognitive Profile Radar Chart */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="text-xl font-bold text-text-primary mb-4">
              Cognitive Profile
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#CBD5E1" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#64748B', fontSize: 14 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#A8E6CF"
                  fill="#A8E6CF"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Feature Importance */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <h3 className="text-xl font-bold text-text-primary mb-4">
              Key Diagnostic Factors
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureImportanceData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748B', fontSize: 12 }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fill: '#64748B' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#89CFF0" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Explanation Panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 mb-8"
        >
          <h3 className="text-2xl font-bold text-text-primary mb-6">
            Why This Result?
          </h3>

          {/* Primary Indicators */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-text-primary mb-3">
              Primary Indicators
            </h4>
            <div className="space-y-2">
              {state.combined_explanation.primary_factors.map((factor, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-start gap-3 bg-white/50 p-3 rounded-lg"
                >
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <span className="text-text-primary">{factor}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Detailed Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Reading */}
            <div className="bg-soft-blue/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Book className="w-5 h-5 text-soft-blue" />
                <h5 className="font-semibold text-text-primary">Reading</h5>
              </div>
              <ul className="space-y-1 text-sm text-text-secondary">
                {state.combined_explanation.detailed_breakdown.reading.map(
                  (item, i) => (
                    <li key={i}>• {item}</li>
                  )
                )}
              </ul>
            </div>

            {/* Writing */}
            <div className="bg-lavender/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Pencil className="w-5 h-5 text-lavender" />
                <h5 className="font-semibold text-text-primary">Writing</h5>
              </div>
              <ul className="space-y-1 text-sm text-text-secondary">
                {state.combined_explanation.detailed_breakdown.writing.map(
                  (item, i) => (
                    <li key={i}>• {item}</li>
                  )
                )}
                {state.combined_explanation.detailed_breakdown.writing
                  .length === 0 && (
                  <li className="text-green-600">• No significant issues</li>
                )}
              </ul>
            </div>

            {/* Behavioral */}
            <div className="bg-pale-yellow/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-yellow-600" />
                <h5 className="font-semibold text-text-primary">Behavioral</h5>
              </div>
              <ul className="space-y-1 text-sm text-text-secondary">
                {state.combined_explanation.detailed_breakdown.behavioral.map(
                  (item, i) => (
                    <li key={i}>• {item}</li>
                  )
                )}
                {state.combined_explanation.detailed_breakdown.behavioral
                  .length === 0 && (
                  <li className="text-green-600">• No significant issues</li>
                )}
              </ul>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-mint/20 p-6 rounded-lg border-2 border-mint">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-mint flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-2">
                  Recommendation
                </h4>
                <p className="text-text-primary leading-relaxed">
                  {state.combined_explanation.recommendation}
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
          className="flex gap-4 justify-center"
        >
          <button className="flex items-center gap-2 bg-soft-blue hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105">
            <Download className="w-5 h-5" />
            Download PDF Report
          </button>
          <button className="flex items-center gap-2 bg-white hover:bg-gray-100 text-text-primary font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 border-2 border-gray-300">
            <FileText className="w-5 h-5" />
            Email Report
          </button>
        </motion.div>
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
