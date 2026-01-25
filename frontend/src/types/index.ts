/**
 * Type definitions for MindStep Platform
 */

// ============================================================================
// Eye-Tracking & Reading Assessment
// ============================================================================

export interface GazePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface ReadingMetrics {
  gaze_points: GazePoint[];
  text_length: number;
  reading_duration: number;
  reading_speed?: number; // words per minute
  fixation_count?: number;
  avg_fixation_duration?: number;
  regression_index?: number;
  heatmap_data?: HeatmapPoint[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number;
}

export interface Fixation {
  x: number;
  y: number;
  duration: number;
  startTime: number;
  endTime: number;
}

// ============================================================================
// Writing & Handwriting Assessment
// ============================================================================

export interface Stroke {
  points: { x: number; y: number; timestamp: number }[];
  startTime: number;
  endTime: number;
}

export interface WritingAnalysis {
  gemini_response: string;
  stroke_count: number;
  avg_stroke_speed: number;
  pressure_variance: number;
  image_data: string; // Base64
}

export interface GeminiWritingResult {
  mirror_writing_detected: boolean;
  mirror_letters: string[];
  letter_spacing_irregular: boolean;
  spacing_score: number;
  tremor_detected: boolean;
  tremor_severity: 'None' | 'Mild' | 'Moderate' | 'Severe';
  orthographic_errors: string[];
  overall_risk: 'Low' | 'Moderate' | 'High';
  confidence: number;
}

// ============================================================================
// Behavioral Chatbot
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
}

export interface ChatbotAnalysis {
  memory_score: number; // 0-10
  attention_score: number; // 0-10
  comprehension_score: number; // 0-10
  behavioral_notes: string;
  risk_indicators: string[];
  overall_cognitive_risk: 'Low' | 'Moderate' | 'High';
}

// ============================================================================
// Backend API Types
// ============================================================================

export interface PredictionRequest {
  reading_data: {
    gaze_points: GazePoint[];
    text_length: number;
    reading_duration: number;
  };
}

export interface FeatureImportance {
  num_fixations: number;
  mean_fixation_duration: number;
  median_fixation_duration: number;
  total_reading_time: number;
  mean_fixation_x: number;
  std_fixation_y: number;
  entropy_fixation_duration: number;
  autocorrelation: number;
  cv_inter_fixation_intervals: number;
  meta_variability: number;
  tvi_score: number;
  weighted_tvi_score: number;
}

export interface Explanation {
  primary_indicators: string[];
  feature_importance: FeatureImportance;
  recommendation: string;
}

export interface BackendPrediction {
  risk_score: number;
  confidence: number;
  classification: 'Low Risk' | 'Moderate Risk' | 'High Risk';
  explanation: Explanation;
  model_version: string;
}

// ============================================================================
// Diagnosis State Management
// ============================================================================

export type AssessmentStatus = 'idle' | 'collecting' | 'analyzing' | 'complete' | 'error';

export interface DiagnosisState {
  // Assessment data
  reading_data: ReadingMetrics | null;
  writing_data: WritingAnalysis | null;
  chatbot_data: ChatbotAnalysis | null;

  // Predictions
  backend_prediction: BackendPrediction | null;

  // Final results
  final_score: number | null;
  final_classification: 'Low Risk' | 'Moderate Risk' | 'High Risk' | null;
  combined_explanation: CombinedExplanation | null;

  // Status tracking
  status: AssessmentStatus;
  current_step: number;
  total_steps: number;
  error: string | null;

  // Progress flags
  reading_complete: boolean;
  writing_complete: boolean;
  chatbot_complete: boolean;
}

export interface CombinedExplanation {
  primary_factors: string[];
  confidence: number;
  recommendation: string;
  detailed_breakdown: {
    reading: string[];
    writing: string[];
    behavioral: string[];
  };
}

// ============================================================================
// Dashboard & Visualization
// ============================================================================

export interface RadarChartData {
  metric: string;
  value: number;
  fullMark: number;
}

export interface TimelinePoint {
  date: string;
  risk_score: number;
  classification: string;
}

export interface RecommendationItem {
  icon: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
}

// ============================================================================
// UI Component Props
// ============================================================================

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface ProgressIndicatorProps {
  current: number;
  total: number;
  label?: string;
}

export interface RiskGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

// ============================================================================
// WebGazer Types
// ============================================================================

declare global {
  interface Window {
    webgazer: {
      setGazeListener: (
        callback: (data: { x: number; y: number } | null, timestamp: number) => void
      ) => Window['webgazer'];
      begin: () => Promise<void>;
      end: () => void;
      pause: () => Window['webgazer'];
      resume: () => Window['webgazer'];
      showPredictionPoints: (show: boolean) => Window['webgazer'];
      showVideo: (show: boolean) => Window['webgazer'];
      showFaceOverlay: (show: boolean) => Window['webgazer'];
      showFaceFeedbackBox: (show: boolean) => Window['webgazer'];
      clearData: () => void;
      setRegression: (type: string) => Window['webgazer'];
      setTracker: (type: string) => Window['webgazer'];
      applyKalmanFilter: (enable: boolean) => Window['webgazer'];
      params: {
        showVideo: boolean;
        showFaceOverlay: boolean;
        showFaceFeedbackBox: boolean;
      };
    };
  }
}

// ============================================================================
// Gemini API Types
// ============================================================================

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface GeminiRequest {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }[];
}
