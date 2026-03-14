/**
 * Dashboard Component
 * Displays comprehensive dyslexia assessment results with visualizations
 * Includes recommended exercises based on assessment results
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'recharts';
import {
  AlertCircle,
  CheckCircle,
  Download,
  Book,
  Pencil,
  Brain,
  Gamepad2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useDiagnosis } from '@/context/DiagnosisProvider';
import confetti from 'canvas-confetti';
import { ALL_EXERCISES } from '@/data/exercises';
import jsPDF from 'jspdf';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = useDiagnosis();
  const [countedScore, setCountedScore] = useState(0);
  const { t } = useTranslation();

  // Get recommended exercises based on risk score and weak areas
  const getRecommendedExercises = () => {
    const riskScore = state.final_score || 0;
    const recommendations: string[] = [];

    // High priority for higher risk scores
    if (riskScore > 60) {
      recommendations.push('letter-tracing', 'word-flash', 'mirror-detective');
    } else if (riskScore > 40) {
      recommendations.push('syllable-game', 'reading-tracker', 'odd-one-out');
    } else {
      recommendations.push('sequence-memory', 'sound-matching', 'reading-tracker');
    }

    // Add memory exercises if attention/memory scores are low
    if (state.chatbot_data) {
      if (state.chatbot_data.memory_score < 7) {
        if (!recommendations.includes('sequence-memory')) {
          recommendations.push('sequence-memory');
        }
      }
      if (state.chatbot_data.attention_score < 7) {
        if (!recommendations.includes('odd-one-out')) {
          recommendations.push('odd-one-out');
        }
      }
    }

    return ALL_EXERCISES.filter((ex) => recommendations.includes(ex.id)).slice(0, 4);
  };

  const recommendedExercises = getRecommendedExercises();

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
    return;
  }, [state.final_score]);

  // ====== PDF Report Generation ======
  const generatePDFReport = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Embed NotoSans for full Unicode (Cyrillic / Kazakh) support
    try {
      const [regularBytes, boldBytes] = await Promise.all([
        fetch('/fonts/NotoSans-Regular.ttf').then((r) => r.arrayBuffer()),
        fetch('/fonts/NotoSans-Bold.ttf').then((r) => r.arrayBuffer()),
      ]);
      const toBase64 = (buf: ArrayBuffer) =>
        btoa(String.fromCharCode(...new Uint8Array(buf)));
      doc.addFileToVFS('NotoSans-Regular.ttf', toBase64(regularBytes));
      doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
      doc.addFileToVFS('NotoSans-Bold.ttf', toBase64(boldBytes));
      doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
    } catch {
      // Fallback to helvetica if fonts fail to load
    }

    // Title
    doc.setFontSize(22);
    doc.setFont('NotoSans', 'bold');
    doc.text(t('pdf.title'), pageWidth / 2, 22, { align: 'center' });

    // Date
    doc.setFontSize(11);
    doc.setFont('NotoSans', 'normal');
    doc.text(`${t('pdf.date')}: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 20, 34);

    // Divider
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.7);
    doc.line(20, 38, pageWidth - 20, 38);

    // Overall Score
    doc.setFontSize(16);
    doc.setFont('NotoSans', 'bold');
    doc.text(t('pdf.overallRisk'), 20, 50);
    doc.setFontSize(12);
    doc.setFont('NotoSans', 'normal');
    doc.text(`${t('pdf.finalRiskScore')}: ${Math.round(state.final_score || 0)} / 100`, 28, 60);
    doc.text(`${t('pdf.classification')}: ${state.final_classification || 'N/A'}`, 28, 68);
    doc.text(`${t('pdf.confidence')}: ${((state.combined_explanation?.confidence || 0) * 100).toFixed(1)}%`, 28, 76);

    // Chatbot / Cognitive Scores
    doc.setFontSize(16);
    doc.setFont('NotoSans', 'bold');
    doc.text(t('pdf.cognitiveAssessment'), 20, 92);
    doc.setFontSize(12);
    doc.setFont('NotoSans', 'normal');
    if (state.chatbot_data) {
      doc.text(`${t('pdf.memoryScore')}: ${state.chatbot_data.memory_score.toFixed(1)} / 10`, 28, 102);
      doc.text(`${t('pdf.attentionScore')}: ${state.chatbot_data.attention_score.toFixed(1)} / 10`, 28, 110);
      doc.text(`${t('pdf.comprehensionScore')}: ${state.chatbot_data.comprehension_score.toFixed(1)} / 10`, 28, 118);
      doc.text(`${t('pdf.cognitiveRisk')}: ${state.chatbot_data.overall_cognitive_risk}`, 28, 126);
    } else {
      doc.text(t('pdf.chatbotNotCompleted'), 28, 102);
    }

    // Eye-tracking
    doc.setFontSize(16);
    doc.setFont('NotoSans', 'bold');
    doc.text(t('pdf.eyeTrackingAnalysis'), 20, 142);
    doc.setFontSize(12);
    doc.setFont('NotoSans', 'normal');
    if (state.backend_prediction) {
      doc.text(`${t('pdf.riskScoreLabel')}: ${state.backend_prediction.risk_score.toFixed(1)} / 100`, 28, 152);
      doc.text(`${t('pdf.classification')}: ${state.backend_prediction.classification}`, 28, 160);
      doc.text(`${t('pdf.modelConfidence')}: ${(state.backend_prediction.confidence * 100).toFixed(1)}%`, 28, 168);
    } else {
      doc.text(t('pdf.eyeTrackingNotAvailable'), 28, 152);
    }

    // Handwriting
    doc.setFontSize(16);
    doc.setFont('NotoSans', 'bold');
    doc.text(t('pdf.handwritingAnalysis'), 20, 184);
    doc.setFontSize(12);
    doc.setFont('NotoSans', 'normal');
    if (state.writing_data) {
      doc.text(`${t('pdf.strokeCount')}: ${state.writing_data.stroke_count}`, 28, 194);
      doc.text(`${t('pdf.avgStrokeSpeed')}: ${state.writing_data.avg_stroke_speed.toFixed(1)}`, 28, 202);
    } else {
      doc.text(t('pdf.handwritingNotCompleted'), 28, 194);
    }

    // Recommendation
    doc.setFontSize(16);
    doc.setFont('NotoSans', 'bold');
    doc.text(t('pdf.recommendations'), 20, 220);
    doc.setFontSize(11);
    doc.setFont('NotoSans', 'normal');
    const rec = state.combined_explanation?.recommendation || '';
    const recLines = doc.splitTextToSize(rec, pageWidth - 50);
    doc.text(recLines, 28, 230);

    // Primary indicators
    const indicators = state.combined_explanation?.primary_factors || [];
    if (indicators.length > 0) {
      let y = 230 + recLines.length * 6 + 14;
      doc.setFontSize(14);
      doc.setFont('NotoSans', 'bold');
      doc.text(t('pdf.keyIndicators'), 20, y);
      y += 8;
      doc.setFontSize(11);
      doc.setFont('NotoSans', 'normal');
      indicators.forEach((ind: string) => {
        const lines = doc.splitTextToSize(`• ${ind}`, pageWidth - 50);
        doc.text(lines, 28, y);
        y += lines.length * 6 + 2;
      });
    }

    // Footer
    doc.setFontSize(9);
    doc.setFont('NotoSans', 'normal');
    doc.text(
      t('pdf.disclaimer'),
      pageWidth / 2,
      285,
      { align: 'center' }
    );

    doc.save('MindStep_Report.pdf');
  };

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
          <p className="mt-4 text-xl text-white">{t('dashboard.analyzingResults')}</p>
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



  // Prepare radar chart data
  const radarData = [
    {
      metric: t('dashboard.radarMetrics.reading'),
      value: state.backend_prediction
        ? 100 - state.backend_prediction.risk_score
        : 50,
      fullMark: 100,
    },
    {
      metric: t('dashboard.radarMetrics.eyeTracking'),
      value: state.reading_data?.regression_index
        ? (1 - state.reading_data.regression_index) * 100
        : 50,
      fullMark: 100,
    },
    {
      metric: t('dashboard.radarMetrics.handwriting'),
      value: state.writing_data
  ? 70  // Default score since gemini_response is string, not object
  : 50,
      fullMark: 100,
    },
    {
      metric: t('dashboard.radarMetrics.memory'),
      value: state.chatbot_data ? state.chatbot_data.memory_score * 10 : 50,
      fullMark: 100,
    },
    {
      metric: t('dashboard.radarMetrics.attention'),
      value: state.chatbot_data ? state.chatbot_data.attention_score * 10 : 50,
      fullMark: 100,
    },
  ];

  // Prepare feature importance data
  const featureImportanceData = state.backend_prediction
    ? [
        {
          name: t('dashboard.featureNames.fixationDuration'),
          value: parseFloat(
            (state.backend_prediction.explanation.feature_importance
              .mean_fixation_duration / 500).toFixed(2)
          ),
        },
        {
          name: t('dashboard.featureNames.entropy'),
          value: parseFloat(
            (state.backend_prediction.explanation.feature_importance
              .entropy_fixation_duration / 3).toFixed(2)
          ),
        },
        {
          name: t('dashboard.featureNames.autocorrelation'),
          value: Math.abs(
            parseFloat(
              (state.backend_prediction.explanation.feature_importance
                .autocorrelation * 2).toFixed(2)
            )
          ),
        },
        {
          name: t('dashboard.featureNames.tviScore'),
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
            {t('dashboard.title')}
          </h1>
          <p className="text-white/80 text-lg">
            {t('dashboard.subtitle')}
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
            {t('dashboard.overallRisk')}
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
              <span className="text-sm text-text-secondary">{t('dashboard.riskScore')}</span>
            </div>
          </div>

          <div className={`inline-block px-6 py-3 rounded-full ${riskColor}`}>
            <span className="text-white font-bold text-xl">
              {state.final_classification === 'Low Risk'
                ? t('exercises.hub.riskLow')
                : state.final_classification === 'Moderate Risk'
                ? t('exercises.hub.riskModerate')
                : t('exercises.hub.riskHigh')}
            </span>
          </div>

          <p className="mt-4 text-text-secondary">
            {t('dashboard.confidence')}: {(state.combined_explanation.confidence * 100).toFixed(1)}%
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
              {t('dashboard.cognitiveProfile')}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(0,0,0,0.1)" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: '#334155', fontSize: 14, fontWeight: 600 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar
                  name="Performance"
                  dataKey="value"
                  stroke="#6366F1"
                  fill="#6366F1"
                  fillOpacity={0.3}
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
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
              {t('dashboard.keyDiagnosticFactors')}
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
            {t('dashboard.whyThisResult')}
          </h3>

          {/* Primary Indicators */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-text-primary mb-3">
              {t('dashboard.primaryIndicators')}
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
                <h5 className="font-semibold text-text-primary">{t('dashboard.readingLabel')}</h5>
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
                <h5 className="font-semibold text-text-primary">{t('dashboard.writingLabel')}</h5>
              </div>
              <ul className="space-y-1 text-sm text-text-secondary">
                {state.combined_explanation.detailed_breakdown.writing.map(
                  (item, i) => (
                    <li key={i}>• {item}</li>
                  )
                )}
                {state.combined_explanation.detailed_breakdown.writing
                  .length === 0 && (
                  <li className="text-green-600">• {t('dashboard.noSignificantIssues')}</li>
                )}
              </ul>
            </div>

            {/* Behavioral */}
            <div className="bg-pale-yellow/20 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-5 h-5 text-yellow-600" />
                <h5 className="font-semibold text-text-primary">{t('dashboard.behavioralLabel')}</h5>
              </div>
              <ul className="space-y-1 text-sm text-text-secondary">
                {state.combined_explanation.detailed_breakdown.behavioral.map(
                  (item, i) => (
                    <li key={i}>• {item}</li>
                  )
                )}
                {state.combined_explanation.detailed_breakdown.behavioral
                  .length === 0 && (
                  <li className="text-green-600">• {t('dashboard.noSignificantIssues')}</li>
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
                  {t('dashboard.recommendation')}
                </h4>
                <p className="text-text-primary leading-relaxed">
                  {state.combined_explanation.recommendation}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Recommended Exercises Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-mint to-soft-blue rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-text-primary">
                  {t('dashboard.recommendedExercises')}
                </h3>
                <p className="text-text-secondary">
                  {t('dashboard.basedOnResults')}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/exercises')}
              className="flex items-center gap-2 bg-mint hover:bg-green-400 text-white font-bold py-2 px-6 rounded-full transition-all"
            >
              <Gamepad2 className="w-5 h-5" />
              {t('dashboard.viewAll')}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedExercises.map((exercise, index) => (
              <motion.button
                key={exercise.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/exercises')}
                className="bg-white/50 hover:bg-white/70 p-4 rounded-xl text-left transition-all group"
              >
                <div className="text-3xl mb-2">{exercise.emoji}</div>
                <h4 className="font-bold text-text-primary group-hover:text-soft-blue transition-colors">
                  {t(`exercises.${exercise.id}.name`, { defaultValue: exercise.name })}
                </h4>
                <p className="text-sm text-text-secondary line-clamp-2">
                  {t(`exercises.${exercise.id}.description`, { defaultValue: exercise.description })}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    exercise.difficulty === 'Easy'
                      ? 'bg-green-100 text-green-700'
                      : exercise.difficulty === 'Medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {exercise.difficulty === 'Easy' ? t('common.easy') : exercise.difficulty === 'Medium' ? t('common.medium') : t('common.hard')}
                  </span>
                  <span className="text-xs text-text-secondary">{exercise.duration}</span>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-pale-yellow/30 rounded-lg">
            <p className="text-text-primary text-sm">
              {t('dashboard.exerciseTip')}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <button
            onClick={() => generatePDFReport()}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-full transition-transform hover:scale-105 shadow-lg"
          >
            <Download className="w-5 h-5" />
            {t('dashboard.downloadPDF')}
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/exercises')}
            className="flex items-center gap-2 bg-mint hover:bg-green-400 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg"
          >
            <Gamepad2 className="w-5 h-5" />
            {t('dashboard.startPracticing')}
          </motion.button>
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
