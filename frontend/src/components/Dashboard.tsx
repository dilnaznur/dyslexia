/**
 * Dashboard Component
 * Displays comprehensive dyslexia assessment results with visualizations
 * Includes recommended exercises based on assessment results
 */
import { useEffect, useRef, useState } from 'react';
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
import html2pdf from 'html2pdf.js';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = useDiagnosis();
  const [countedScore, setCountedScore] = useState(0);
  const detailsRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  const uiLang = (i18n.language || 'en').split('-')[0].toLowerCase();

  const translateIndicator = (value: string) => {
    if (value.includes('|')) {
      const [key, paramString] = value.split('|');
      const params: Record<string, string> = {};
      if (paramString) {
        for (const pair of paramString.split(',')) {
          const [paramKey, paramValue] = pair.split('=');
          if (paramKey && paramValue) {
            params[paramKey] = paramValue;
          }
        }
      }
      return t(key, params);
    }

    if (value.startsWith('results.') || value.startsWith('dashboard.')) {
      return t(value, { defaultValue: value });
    }

    // Backward compatibility for any previously stored raw English strings.
    const legacyMap: Record<string, string> = {
      'Reading patterns within typical range': 'results.eyeTracking.description',
      'Irregular temporal reading rhythm detected': 'results.eyeTracking.irregularRhythm',
      'Excessive fixation count observed': 'results.eyeTracking.excessiveFixations',
      'Prolonged fixation durations noted': 'results.eyeTracking.longDurations',
      'Excessive fixation': 'results.eyeTracking.excessiveFixations',
      'Prolonged fixation': 'results.eyeTracking.longDurations',
      'Letter reversal patterns noted in handwriting': 'results.handwriting.letterReversals',
      'Good cognitive engagement and comprehension': 'results.chatbot.description',
      'Low risk detected. Continue monitoring reading development': 'results.recommendation.low',
      'Moderate risk detected. Consider consultation with reading specialist.':
        'results.recommendation.moderate',
      'High risk detected. Professional assessment recommended.': 'results.recommendation.high',
    };
    const key = legacyMap[value];
    return key ? t(key) : value;
  };

  const getLocalizedRecommendation = () => {
    if (state.final_classification === 'Low Risk') return t('results.recommendation.low');
    if (state.final_classification === 'Moderate Risk') return t('results.recommendation.moderate');
    if (state.final_classification === 'High Risk') return t('results.recommendation.high');
    return t('results.recommendation.low');
  };

  const translatePipelineFlag = (flag: string) =>
    t(`handwritingPipeline.flags.${flag}`, { defaultValue: flag });

  const scrollToDetails = () => {
    detailsRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

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
  const generatePDFReport = () => {
    console.log('PDF function called');

    // Helper function for translations
    function getTranslation(key: string, language: string) {
      const translations: Record<string, Record<string, string>> = {
        en: {
          mindstepReport: 'MindStep - Dyslexia Screening Report',
          date: 'Date',
          assessmentResults: 'Assessment Results',
          memoryScore: 'Memory Score',
          attentionScore: 'Attention Score',
          comprehensionScore: 'Comprehension Score',
          cognitiveRisk: 'Cognitive Risk',
          overallRisk: 'Overall Risk Level',
          eyeTracking: 'Eye-Tracking Analysis',
          eyeTrackingAnalysis: 'Eye-Tracking Analysis',
          handwriting: 'Handwriting Analysis',
          handwritingAnalysis: 'Handwriting Analysis',
          finalScore: 'Final Diagnostic Score',
          riskScore: 'Risk Score',
          recommendations: 'Recommendations',
          disclaimer:
            'This is a screening tool, not a diagnosis. Consult a professional for evaluation.',
          Low: 'Low Risk',
          Moderate: 'Moderate Risk',
          High: 'High Risk',
        },
        ru: {
          mindstepReport: 'MindStep — Скрининг дислексии',
          date: 'Дата',
          assessmentResults: 'Результаты оценки',
          memoryScore: 'Память',
          attentionScore: 'Внимание',
          comprehensionScore: 'Понимание',
          cognitiveRisk: 'Когнитивный риск',
          overallRisk: 'Общий уровень риска',
          eyeTracking: 'Анализ движения глаз',
          eyeTrackingAnalysis: 'Анализ движения глаз',
          handwriting: 'Анализ почерка',
          handwritingAnalysis: 'Анализ почерка',
          finalScore: 'Итоговый диагностический балл',
          riskScore: 'Балл риска',
          recommendations: 'Рекомендации',
          disclaimer:
            'Это инструмент скрининга, а не диагноз. Обратитесь к специалисту для оценки.',
          Low: 'Низкий риск',
          Moderate: 'Средний риск',
          High: 'Высокий риск',
        },
        kz: {
          mindstepReport: 'MindStep — Дислексия скринингі',
          date: 'Күні',
          assessmentResults: 'Бағалау нәтижелері',
          memoryScore: 'Жады',
          attentionScore: 'Назар',
          comprehensionScore: 'Түсіну',
          cognitiveRisk: 'Когнитивтік қауіп',
          overallRisk: 'Жалпы қауіп деңгейі',
          eyeTracking: 'Көз қозғалысын талдау',
          eyeTrackingAnalysis: 'Көз қозғалысын талдау',
          handwriting: 'Қолжазба талдау',
          handwritingAnalysis: 'Қолжазба талдау',
          finalScore: 'Қорытынды диагностикалық балл',
          riskScore: 'Қауіп баллы',
          recommendations: 'Ұсыныстар',
          disclaimer:
            'Бұл скрининг құралы, диагноз емес. Бағалау үшін маманға хабарласыңыз.',
          Low: 'Төмен қауіп',
          Moderate: 'Орташа қауіп',
          High: 'Жоғары қауіп',
        },
      };

      return translations[language]?.[key] || translations.en[key] || key;
    }

    const language = uiLang === 'kk' ? 'kz' : uiLang;
    console.log('Generating PDF...');
    console.log('Results:', state);
    console.log('Language:', language);

    const riskRaw = state.final_classification || 'Low Risk';
    const riskKey =
      riskRaw.includes('High') ? 'High' : riskRaw.includes('Moderate') ? 'Moderate' : 'Low';

    const eyeTrackingDescription =
      state.combined_explanation?.detailed_breakdown.reading[0] || 'results.eyeTracking.normal';
    const handwritingDescription =
      state.combined_explanation?.detailed_breakdown.writing[0] || 'results.handwriting.normal';

    const getRiskColor = (riskLevel: string) => {
      if (riskLevel === 'Low') return '#10b981';
      if (riskLevel === 'Moderate') return '#f59e0b';
      return '#ef4444';
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 30px; color: #1f2937;">
        <h1 style="font-size: 28px; margin-bottom: 10px; color: #6366f1;">
          ${getTranslation('mindstepReport', language)}
        </h1>

        <p style="color: #6b7280; font-size: 14px; margin-bottom: 30px;">
          ${getTranslation('date', language)}: ${new Date().toLocaleDateString()}
        </p>

        <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">

        <h2 style="font-size: 20px; margin-top: 25px; margin-bottom: 15px;">
          ${getTranslation('assessmentResults', language)}
        </h2>

        <p style="font-size: 16px; margin: 10px 0;">
          <strong>${getTranslation('memoryScore', language)}:</strong> ${state.chatbot_data?.memory_score?.toFixed(1) ?? '—'}/10
        </p>
        <p style="font-size: 16px; margin: 10px 0;">
          <strong>${getTranslation('attentionScore', language)}:</strong> ${state.chatbot_data?.attention_score?.toFixed(1) ?? '—'}/10
        </p>
        <p style="font-size: 16px; margin: 10px 0;">
          <strong>${getTranslation('comprehensionScore', language)}:</strong> ${state.chatbot_data?.comprehension_score?.toFixed(1) ?? '—'}/10
        </p>
        <p style="font-size: 16px; margin: 10px 0;">
          <strong>${getTranslation('cognitiveRisk', language)}:</strong> ${getTranslation(riskKey, language)}
        </p>

        <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">

        <h2 style="font-size: 20px; margin-top: 25px; margin-bottom: 15px;">
          ${getTranslation('eyeTrackingAnalysis', language)}
        </h2>

        <p style="font-size: 16px; margin: 10px 0;">
          <strong>${getTranslation('riskScore', language)}:</strong> ${state.backend_prediction?.risk_score?.toFixed(1) ?? '—'}/100
        </p>
        <p style="font-size: 14px; margin: 10px 0; color: #6b7280;">
          ${translateIndicator(eyeTrackingDescription)}
        </p>

        <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">

        <h2 style="font-size: 20px; margin-top: 25px; margin-bottom: 15px;">
          ${getTranslation('handwritingAnalysis', language)}
        </h2>

        <p style="font-size: 16px; margin: 10px 0;">
          <strong>${getTranslation('riskScore', language)}:</strong> ${(state.writing_data?.handwriting_pipeline?.final_score ?? 0).toFixed(1)}/100
        </p>
        <p style="font-size: 14px; margin: 10px 0; color: #6b7280;">
          ${translateIndicator(handwritingDescription)}
        </p>

        <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 20px 0;">

        <h2 style="font-size: 20px; margin-top: 25px; margin-bottom: 15px;">
          ${getTranslation('finalScore', language)}
        </h2>

        <p style="font-size: 18px; margin: 15px 0;">
          ${getTranslation('overallRisk', language)}: <strong style="color: ${getRiskColor(riskKey)}">${getTranslation(riskKey, language)}</strong>
        </p>

        <p style="font-size: 24px; font-weight: bold; color: #6366f1; margin: 15px 0;">
          ${Math.round(state.final_score || 0)}/100
        </p>

        <p style="font-size: 14px; margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
          <strong>${getTranslation('recommendations', language)}:</strong><br>
          ${getLocalizedRecommendation()}
        </p>

        <hr style="border: none; border-top: 2px solid #e5e7eb; margin: 30px 0;">

        <p style="font-size: 12px; color: #6b7280; margin-top: 40px;">
          ${getTranslation('disclaimer', language)}
        </p>
      </div>
    `;

    console.log('HTML content length:', htmlContent.length);
    console.log('HTML content:', htmlContent.substring(0, 100));

    const options = {
      margin: 15,
      filename: `MindStep_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };

    console.log('PDF options:', options);

    html2pdf()
      .set(options)
      .from(htmlContent)
      .save()
      .then(() => {
        console.log('PDF generated successfully');
      })
      .catch((error: unknown) => {
        console.error('PDF generation failed:', error);
        alert('Failed to generate PDF. Please try again.');
      });
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

  // Helper function to translate risk classification
  const getClassificationKey = (classification: string | null) => {
    switch (classification) {
      case 'Low Risk':
        return t('dashboard.classificationLowRisk');
      case 'Moderate Risk':
        return t('dashboard.classificationModerateRisk');
      case 'High Risk':
        return t('dashboard.classificationHighRisk');
      default:
        return classification || 'N/A';
    }
  };

  const riskColor =
    state.final_classification === 'Low Risk'
      ? 'bg-green-500'
      : state.final_classification === 'Moderate Risk'
      ? 'bg-yellow-500'
      : 'bg-red-500';

  const handwritingPipeline = state.writing_data?.handwriting_pipeline;
  const handwritingStructured = state.writing_data?.gemini_structured;
  const childAge = state.child_age;



  // Prepare radar chart data
  const radarData = [
    {
      metric: t('charts.reading'),
      value: state.backend_prediction
        ? 100 - state.backend_prediction.risk_score
        : 50,
      fullMark: 100,
    },
    {
      metric: t('charts.eyeTracking'),
      value: state.reading_data?.regression_index
        ? (1 - state.reading_data.regression_index) * 100
        : 50,
      fullMark: 100,
    },
    {
      metric: t('charts.handwriting'),
      value: handwritingPipeline ? 100 - handwritingPipeline.final_score : 50,
      fullMark: 100,
    },
    {
      metric: t('charts.memory'),
      value: state.chatbot_data ? state.chatbot_data.memory_score * 10 : 50,
      fullMark: 100,
    },
    {
      metric: t('charts.attention'),
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
          className="results-hero mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 text-white">{t('dashboard.title')}</h1>
          <p className="text-white/90 mb-6">{t('dashboard.subtitle')}</p>

          <div className="risk-score-card">
            <h2 className="text-2xl font-bold text-text-primary mb-4">{t('dashboard.overallRisk')}</h2>
            <div className="score-circle">
              <span className="score-number">{Math.round(countedScore)}</span>
              <span className="score-max">/100</span>
            </div>

            <div className="risk-level my-4">
              <span className={`risk-badge risk-${state.final_classification?.includes('Low') ? 'low' : state.final_classification?.includes('Moderate') ? 'moderate' : 'high'}`}>
                {getClassificationKey(state.final_classification)}
              </span>
            </div>

            <p className="text-text-secondary mb-4">
              {getLocalizedRecommendation()}
            </p>

            <p className="text-text-secondary mb-4">
              {t('dashboard.confidence')}: {(state.combined_explanation.confidence * 100).toFixed(1)}%
            </p>
          </div>

          <button onClick={scrollToDetails} className="see-details-btn">
            {t('dashboard.seeDetails')}
          </button>
        </motion.div>

        <div style={{ height: '40px' }} />

        {/* Main Grid */}
        <div ref={detailsRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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

        {handwritingPipeline && handwritingStructured && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="glass-card p-8 mb-8"
          >
            <h3 className="text-2xl font-bold text-text-primary mb-2">{t('handwritingPipeline.title')}</h3>
            <p className="text-text-secondary mb-6">
              {t('handwritingPipeline.subtitle')}
            </p>

            <div className="pipeline-stages">
              <div className="stage">
                <div className="stage-number">1</div>
                <div className="stage-content">
                  <h4 className="font-bold text-text-primary">{t('handwritingPipeline.stage1.title')}</h4>
                  <p className="text-sm text-text-secondary">{t('handwritingPipeline.stage1.description')}</p>
                  <div className="stage-data">
                    <span>{t('handwritingPipeline.categories.mirrorWriting')}: {handwritingPipeline.category_scores.mirror_writing.toFixed(1)}/100</span>
                    <span>{t('handwritingPipeline.categories.spatial')}: {handwritingPipeline.category_scores.spatial.toFixed(1)}/100</span>
                    <span>{t('handwritingPipeline.categories.formation')}: {handwritingPipeline.category_scores.formation.toFixed(1)}/100</span>
                    <span>{t('handwritingPipeline.categories.orientation')}: {handwritingPipeline.category_scores.orientation.toFixed(1)}/100</span>
                  </div>
                  <div className="stage-score">{t('handwritingPipeline.rawScore')}: {handwritingPipeline.gemini_raw_score.toFixed(1)}/100</div>
                </div>
              </div>

              <div className="stage">
                <div className="stage-number">2</div>
                <div className="stage-content">
                  <h4 className="font-bold text-text-primary">{t('handwritingPipeline.stage2.title')}</h4>
                  <p className="text-sm text-text-secondary">{t('handwritingPipeline.stage2.description', { age: childAge ?? 8 })}</p>
                  <div className="stage-data">
                    <span>{t('handwritingPipeline.factors.spacing')}: {handwritingPipeline.pipeline_breakdown.stage1_age_adjustment.spacing}x</span>
                    <span>{t('handwritingPipeline.factors.formation')}: {handwritingPipeline.pipeline_breakdown.stage1_age_adjustment.formation}x</span>
                    <span>{t('handwritingPipeline.factors.orientation')}: {handwritingPipeline.pipeline_breakdown.stage1_age_adjustment.orientation}x</span>
                  </div>
                  <div className="stage-score">{t('handwritingPipeline.calibrated')}: {handwritingPipeline.age_calibrated_score.toFixed(1)}/100</div>
                </div>
              </div>

              <div className="stage">
                <div className="stage-number">3</div>
                <div className="stage-content">
                  <h4 className="font-bold text-text-primary">{t('handwritingPipeline.stage3.title')}</h4>
                  <p className="text-sm text-text-secondary">{t('handwritingPipeline.stage3.description')}</p>
                  <div className="stage-data">
                    {handwritingPipeline.clinical_flags.map((flag) => (
                      <span key={flag} className="flag">{translatePipelineFlag(flag)}</span>
                    ))}
                    <span>{t('handwritingPipeline.checksPassed')}: {handwritingPipeline.checks_passed}/4</span>
                  </div>
                  <div className="stage-score">{t('handwritingPipeline.validated')}</div>
                </div>
              </div>

              <div className="stage">
                <div className="stage-number">4</div>
                <div className="stage-content">
                  <h4 className="font-bold text-text-primary">{t('handwritingPipeline.stage4.title')}</h4>
                  <p className="text-sm text-text-secondary">{t('handwritingPipeline.stage4.description')}</p>
                  <div className="stage-data">
                    <span>{t('handwritingPipeline.agreement')}: {handwritingPipeline.cv_agreement}%</span>
                    <span>{t('handwritingPipeline.status')}: {handwritingPipeline.cv_confirmed ? t('handwritingPipeline.confirmed') : t('handwritingPipeline.partial')}</span>
                  </div>
                  <div className="stage-score">{t('handwritingPipeline.final')}: {handwritingPipeline.final_score.toFixed(1)}/100</div>
                </div>
              </div>
            </div>

            <div className="pipeline-summary mt-6 rounded-xl bg-white/60 p-4 border border-indigo-100">
              <h4 className="font-bold text-text-primary">
                {t('handwritingPipeline.summary.title')}: {handwritingPipeline.final_score.toFixed(1)}/100
              </h4>
              <p className="text-sm text-text-secondary">{t('handwritingPipeline.summary.description')}</p>
            </div>
          </motion.div>
        )}

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
              {state.combined_explanation.primary_factors.map((factor, index) => {
                const translatedFactor = translateIndicator(factor);
                console.log('Eye tracking key:', factor);
                console.log('Translated text:', translatedFactor);
                console.log('Current language:', i18n.language);

                return (
                  <motion.div
                    key={index}
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-3 bg-white/50 p-3 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <span className="text-text-primary">{translatedFactor}</span>
                  </motion.div>
                );
              })}
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
                    <li key={i}>• {translateIndicator(item)}</li>
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
                    <li key={i}>• {translateIndicator(item)}</li>
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
                    <li key={i}>• {translateIndicator(item)}</li>
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
                  {getLocalizedRecommendation()}
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

        .pipeline-stages {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .stage {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          border-left: 4px solid #6366f1;
        }

        .stage-number {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
          flex-shrink: 0;
        }

        .stage-content {
          flex: 1;
        }

        .stage-data {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin: 8px 0;
        }

        .stage-data span {
          background: white;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .stage-score {
          font-weight: 600;
          color: #6366f1;
          margin-top: 8px;
        }

        .results-hero {
          text-align: center;
          padding: 60px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
        }

        .risk-score-card {
          background: white;
          color: #1f2937;
          padding: 40px;
          border-radius: 16px;
          max-width: 500px;
          margin: 30px auto;
        }

        .score-circle {
          margin: 20px 0;
        }

        .score-number {
          font-size: 72px;
          font-weight: bold;
          color: #6366f1;
        }

        .score-max {
          font-size: 36px;
          color: #9ca3af;
        }

        .risk-badge {
          display: inline-block;
          padding: 12px 24px;
          border-radius: 24px;
          font-size: 20px;
          font-weight: 600;
          margin: 20px 0;
        }

        .risk-badge.risk-low {
          background: #d1fae5;
          color: #065f46;
        }

        .risk-badge.risk-moderate {
          background: #fed7aa;
          color: #92400e;
        }

        .risk-badge.risk-high {
          background: #fecaca;
          color: #991b1b;
        }

        .see-details-btn {
          background: white;
          color: #6366f1;
          padding: 16px 32px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}
