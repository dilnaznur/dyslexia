/**
 * Backend API client for MindStep platform
 */
import { PredictionRequest, BackendPrediction } from '@/types';

const DEFAULT_LOCAL_API_URL = 'http://127.0.0.1:8000';

// Vercel exposes Vite variables at build time via import.meta.env.
// Keep VITE_API_URL fallback for backwards compatibility.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  DEFAULT_LOCAL_API_URL
).replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message =
      (typeof payload === 'object' && payload && 'detail' in payload
        ? String((payload as { detail?: string }).detail)
        : '') || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  try {
    return await request<T>(path, { method: 'GET' });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error while sending GET request', 0, error);
  }
}

export async function apiPost<TRequest, TResponse>(
  path: string,
  body: TRequest
): Promise<TResponse> {
  try {
    return await request<TResponse>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error while sending POST request', 0, error);
  }
}

/**
 * Check if backend is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const data = await apiGet<{ status: string }>('/health');
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
    // Production endpoint in this backend is /api/v1/predict.
    return await apiPost<PredictionRequest, BackendPrediction>('/api/v1/predict', request);
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
    return await apiPost<
      {
        prediction_id: string;
        actual_diagnosis: boolean;
        clinician_notes?: string;
      },
      { message: string; feedback_id: string }
    >('/api/v1/feedback', {
      prediction_id: predictionId,
      actual_diagnosis: actualDiagnosis,
      clinician_notes: clinicianNotes,
    });
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
    return await apiGet('/api/v1/stats');
  } catch (error) {
    console.error('Statistics API error:', error);
    throw error;
  }
}

// Example GET request helper for root endpoint.
export async function getApiInfo(): Promise<{ message: string; version: string; docs: string }> {
  return apiGet<{ message: string; version: string; docs: string }>('/');
}

// Example POST request helper for a /predict-style path.
export async function postPredict(path: string, payload: PredictionRequest): Promise<BackendPrediction> {
  return apiPost<PredictionRequest, BackendPrediction>(path, payload);
}
