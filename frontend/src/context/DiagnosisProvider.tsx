/**
 * Diagnosis Context Provider
 * Manages global state for multi-modal dyslexia assessment
 */
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import {
  DiagnosisState,
  ReadingMetrics,
  WritingAnalysis,
  ChatbotAnalysis,
  BackendPrediction,
  CombinedExplanation,
  AssessmentStatus,
} from '@/types';
import { predictDyslexiaRisk } from '@/lib/api';

// ============================================================================
// Context Definition
// ============================================================================

interface DiagnosisContextType {
  state: DiagnosisState;
  setReadingData: (data: ReadingMetrics) => void;
  setWritingData: (data: WritingAnalysis) => void;
  setChatbotData: (data: ChatbotAnalysis) => void;
  processBackendPrediction: () => Promise<void>;
  calculateFinalScore: () => void;
  reset: () => void;
}

const DiagnosisContext = createContext<DiagnosisContextType | undefined>(
  undefined
);

// ============================================================================
// State & Actions
// ============================================================================

type DiagnosisAction =
  | { type: 'SET_READING_DATA'; payload: ReadingMetrics }
  | { type: 'SET_WRITING_DATA'; payload: WritingAnalysis }
  | { type: 'SET_CHATBOT_DATA'; payload: ChatbotAnalysis }
  | { type: 'SET_BACKEND_PREDICTION'; payload: BackendPrediction }
  | { type: 'SET_FINAL_SCORE'; payload: { score: number; classification: string; explanation: CombinedExplanation } }
  | { type: 'SET_STATUS'; payload: AssessmentStatus }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'INCREMENT_STEP' }
  | { type: 'RESET' };

const initialState: DiagnosisState = {
  reading_data: null,
  writing_data: null,
  chatbot_data: null,
  backend_prediction: null,
  final_score: null,
  final_classification: null,
  combined_explanation: null,
  status: 'idle',
  current_step: 0,
  total_steps: 3,
  error: null,
  reading_complete: false,
  writing_complete: false,
  chatbot_complete: false,
};

function diagnosisReducer(
  state: DiagnosisState,
  action: DiagnosisAction
): DiagnosisState {
  switch (action.type) {
    case 'SET_READING_DATA':
      return {
        ...state,
        reading_data: action.payload,
        reading_complete: true,
        current_step: Math.max(state.current_step, 1),
      };

    case 'SET_WRITING_DATA':
      return {
        ...state,
        writing_data: action.payload,
        writing_complete: true,
        current_step: Math.max(state.current_step, 2),
      };

    case 'SET_CHATBOT_DATA':
      return {
        ...state,
        chatbot_data: action.payload,
        chatbot_complete: true,
        current_step: Math.max(state.current_step, 3),
      };

    case 'SET_BACKEND_PREDICTION':
      return {
        ...state,
        backend_prediction: action.payload,
      };

    case 'SET_FINAL_SCORE':
      return {
        ...state,
        final_score: action.payload.score,
        final_classification: action.payload.classification as DiagnosisState['final_classification'],
        combined_explanation: action.payload.explanation,
        status: 'complete',
      };

    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        status: 'error',
      };

    case 'INCREMENT_STEP':
      return {
        ...state,
        current_step: Math.min(state.current_step + 1, state.total_steps),
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// ============================================================================
// Provider Component
// ============================================================================

interface DiagnosisProviderProps {
  children: ReactNode;
}

export function DiagnosisProvider({ children }: DiagnosisProviderProps) {
  const [state, dispatch] = useReducer(diagnosisReducer, initialState);

  const setReadingData = (data: ReadingMetrics) => {
    dispatch({ type: 'SET_READING_DATA', payload: data });
  };

  const setWritingData = (data: WritingAnalysis) => {
    dispatch({ type: 'SET_WRITING_DATA', payload: data });
  };

  const setChatbotData = (data: ChatbotAnalysis) => {
    dispatch({ type: 'SET_CHATBOT_DATA', payload: data });
  };

  const processBackendPrediction = async () => {
    if (!state.reading_data) {
      dispatch({ type: 'SET_ERROR', payload: 'No reading data available' });
      return;
    }

    try {
      dispatch({ type: 'SET_STATUS', payload: 'analyzing' });

      const prediction = await predictDyslexiaRisk({
        reading_data: {
          gaze_points: state.reading_data.gaze_points,
          text_length: state.reading_data.text_length,
          reading_duration: state.reading_data.reading_duration,
        },
      });

      dispatch({ type: 'SET_BACKEND_PREDICTION', payload: prediction });
    } catch (error) {
      console.error('Backend prediction failed:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: 'Failed to get prediction from backend',
      });
    }
  };

  const calculateFinalScore = () => {
    const { backend_prediction, writing_data, chatbot_data } = state;

    if (!backend_prediction) {
      dispatch({ type: 'SET_ERROR', payload: 'Backend prediction not available' });
      return;
    }

    // Weighted fusion algorithm
    const weights = {
      backend_ml: 0.45,
      gemini_writing: 0.25,
      gemini_chatbot: 0.20,
      eye_tracking: 0.10,
    };

    // Convert writing risk to numeric (0-100)
    const writingRiskMap = { Low: 20, Moderate: 50, High: 80 };
    const writingRiskNumeric = writing_data
      ? writingRiskMap[writing_data.gemini_response.overall_risk]
      : 50;

    // Convert chatbot risk to numeric (0-100)
    const chatbotRiskMap = { Low: 20, Moderate: 50, High: 80 };
    const chatbotRiskNumeric = chatbot_data
      ? chatbotRiskMap[chatbot_data.overall_cognitive_risk]
      : 50;

    // Eye tracking risk (based on regression index and fixation duration)
    const eyeTrackingRisk = state.reading_data
      ? calculateEyeTrackingRisk(state.reading_data)
      : 50;

    // Calculate weighted final score
    const finalScore =
      weights.backend_ml * backend_prediction.risk_score +
      weights.gemini_writing * writingRiskNumeric +
      weights.gemini_chatbot * chatbotRiskNumeric +
      weights.eye_tracking * eyeTrackingRisk;

    // Classify based on final score
    let classification: 'Low Risk' | 'Moderate Risk' | 'High Risk';
    if (finalScore < 40) {
      classification = 'Low Risk';
    } else if (finalScore < 70) {
      classification = 'Moderate Risk';
    } else {
      classification = 'High Risk';
    }

    // Generate combined explanation
    const explanation = generateCombinedExplanation(
      backend_prediction,
      writing_data,
      chatbot_data,
      state.reading_data
    );

    dispatch({
      type: 'SET_FINAL_SCORE',
      payload: {
        score: finalScore,
        classification,
        explanation,
      },
    });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  const value: DiagnosisContextType = {
    state,
    setReadingData,
    setWritingData,
    setChatbotData,
    processBackendPrediction,
    calculateFinalScore,
    reset,
  };

  return (
    <DiagnosisContext.Provider value={value}>
      {children}
    </DiagnosisContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useDiagnosis(): DiagnosisContextType {
  const context = useContext(DiagnosisContext);
  if (!context) {
    throw new Error('useDiagnosis must be used within DiagnosisProvider');
  }
  return context;
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateEyeTrackingRisk(readingData: ReadingMetrics): number {
  // Higher regression index = higher risk
  const regressionRisk = (readingData.regression_index || 0) * 100;

  // Higher fixation duration = higher risk (typical: 200-250ms)
  const fixationRisk = readingData.avg_fixation_duration
    ? Math.min(((readingData.avg_fixation_duration - 250) / 250) * 100, 100)
    : 0;

  // Combine (simple average)
  return Math.max(0, Math.min((regressionRisk + fixationRisk) / 2, 100));
}

function generateCombinedExplanation(
  backendPrediction: BackendPrediction,
  writingData: WritingAnalysis | null,
  chatbotData: ChatbotAnalysis | null,
  readingData: ReadingMetrics | null
): CombinedExplanation {
  const primaryFactors: string[] = [];
  const readingIndicators: string[] = [];
  const writingIndicators: string[] = [];
  const behavioralIndicators: string[] = [];

  // Reading indicators
  if (backendPrediction.explanation.primary_indicators.length > 0) {
    primaryFactors.push(...backendPrediction.explanation.primary_indicators);
    readingIndicators.push(...backendPrediction.explanation.primary_indicators);
  }

  // Writing indicators
  if (writingData) {
    if (writingData.gemini_response.mirror_writing_detected) {
      const indicator = 'Mirror writing patterns detected';
      primaryFactors.push(indicator);
      writingIndicators.push(indicator);
    }
    if (writingData.gemini_response.letter_spacing_irregular) {
      const indicator = 'Irregular letter spacing observed';
      writingIndicators.push(indicator);
    }
    if (writingData.gemini_response.tremor_detected) {
      const indicator = `Tremor detected (${writingData.gemini_response.tremor_severity})`;
      writingIndicators.push(indicator);
    }
  }

  // Behavioral indicators
  if (chatbotData) {
    if (chatbotData.memory_score < 5) {
      const indicator = 'Below-average memory recall';
      primaryFactors.push(indicator);
      behavioralIndicators.push(indicator);
    }
    if (chatbotData.attention_score < 5) {
      const indicator = 'Attention challenges observed';
      behavioralIndicators.push(indicator);
    }
    if (chatbotData.comprehension_score < 5) {
      const indicator = 'Comprehension difficulties noted';
      behavioralIndicators.push(indicator);
    }
  }

  // Calculate overall confidence
  const confidence = backendPrediction.confidence;

  // Generate recommendation based on combined data
  const recommendation = backendPrediction.explanation.recommendation;

  return {
    primary_factors: primaryFactors.slice(0, 5), // Top 5
    confidence,
    recommendation,
    detailed_breakdown: {
      reading: readingIndicators,
      writing: writingIndicators,
      behavioral: behavioralIndicators,
    },
  };
}
