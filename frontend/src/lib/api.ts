/**
 * Backend API client for MindStep platform
 */
import { PredictionRequest, BackendPrediction } from '@/types';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Check if backend is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Health check error:', error);
    return false;
  }
}

/**
 * Submit reading data for dyslexia risk prediction
 */
export async function predictDyslexiaRisk(
  request: PredictionRequest
): Promise<BackendPrediction> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || `Prediction failed: ${response.status}`
      );
    }

    const prediction: BackendPrediction = await response.json();
    return prediction;
  } catch (error) {
    console.error('Prediction API error:', error);
    throw error;
  }
}

/**
 * Submit feedback for model improvement
 */
export async function submitFeedback(
  predictionId: string,
  actualDiagnosis: boolean,
  clinicianNotes?: string
): Promise<{ message: string; feedback_id: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prediction_id: predictionId,
        actual_diagnosis: actualDiagnosis,
        clinician_notes: clinicianNotes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Feedback submission failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Feedback API error:', error);
    throw error;
  }
}

/**
 * Get platform statistics
 */
export async function getStatistics(): Promise<{
  total_assessments: number;
  feedback_submissions: number;
  model_accuracy: number;
  high_confidence_accuracy: number;
}> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Stats fetch failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Statistics API error:', error);
    throw error;
  }
}
