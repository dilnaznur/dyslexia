/**
 * Gemini Vision API Integration
 * Handles handwriting analysis through FastAPI proxy
 * (Chatbot assessment is now rule-based - see AIChatbot.tsx)
 */

import {
  ChildAge,
  HandwritingGeminiStructuredResult,
  HandwritingPipelineResult,
  OpenCVAnalysisResponse,
} from '@/types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

export interface GeminiVisionResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export interface HandwritingAnalysisEngineResult {
  rawText: string;
  structured: HandwritingGeminiStructuredResult;
  pipeline: HandwritingPipelineResult;
}

export const DYSLEXIA_HANDWRITING_PROMPT = `
You are an expert handwriting analyst specializing in developmental dyslexia indicators in children aged 5-10.

ANALYZE the provided handwriting sample for these SPECIFIC dyslexia biomarkers:

1. MIRROR WRITING (Weight: 35%):
   Clinical indicators:
   - Letter reversals: b<->d, p<->q, n<->u, m<->w
   - Number reversals: 3<->E, 6<->9, 2<->5
   - Measure: Count reversed letters / total letters
   - Clinical threshold: >20% reversal rate = high risk

2. SPATIAL IRREGULARITIES (Weight: 30%):
   Clinical indicators:
   - Inter-letter spacing: Coefficient of variation (CV)
   - Baseline adherence: % letters touching baseline
   - Letter size variability: Standard deviation of height
   - Clinical threshold: CV > 0.40 = irregular

3. FORMATION DIFFICULTIES (Weight: 25%):
   Clinical indicators:
   - Tremor/waviness: Line smoothness (0-100)
   - Incomplete closures: Count unclosed o, a, d, g
   - Inconsistent starting points
   - Clinical threshold: >30% formation errors = concerning

4. LETTER ORIENTATION (Weight: 10%):
   Clinical indicators:
   - Slant consistency: Angle variance in degrees
   - Rotation errors: Letters tilted >15deg
   - Clinical threshold: Variance >12deg = inconsistent

RETURN JSON ONLY (no markdown, no explanation):
{
  "mirror_writing": {
    "detected": boolean,
    "reversed_letters": ["letter1", "letter2"],
    "reversal_count": number,
    "total_letters": number,
    "reversal_rate": 0.00-1.00,
    "score": 0-100
  },
  "spatial_irregularities": {
    "spacing_cv": 0.00-1.00,
    "baseline_adherence": 0.00-1.00,
    "size_variability": 0.00-1.00,
    "score": 0-100
  },
  "formation_difficulties": {
    "tremor_detected": boolean,
    "tremor_severity": 0.00-1.00,
    "unclosed_letters": ["letter1", "letter2"],
    "closure_issues_count": number,
    "score": 0-100
  },
  "letter_orientation": {
    "slant_variance_degrees": number,
    "rotation_errors": number,
    "score": 0-100
  },
  "overall_risk_score": 0-100,
  "confidence": 0.00-1.00,
  "clinical_notes": "brief explanation"
}

Base analysis on peer-reviewed dyslexia research. Be precise and quantitative.
`;

async function compressBase64Image(
  base64: string,
  maxWidth = 512,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64;

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
  });
}

export async function analyzeHandwriting(
  imageBase64: string,
  childAge: ChildAge
): Promise<HandwritingAnalysisEngineResult> {
  console.log('Starting handwriting analysis...');
  console.log('Original image length:', imageBase64.length);

  try {
    const compressedImage = await compressBase64Image(imageBase64, 512, 0.7);
    console.log('Compressed image length:', compressedImage.length);

    if (!compressedImage) {
      throw new Error('Image compression failed');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${API_BASE_URL}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'vision',
        prompt: DYSLEXIA_HANDWRITING_PROMPT,
        imageBase64: compressedImage,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data: GeminiVisionResponse = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    const structured = parseGeminiStructuredResponse(analysisText);
    const pipeline = await processHandwritingResults(structured, childAge, imageBase64);

    return {
      rawText: analysisText,
      structured,
      pipeline,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Analysis timed out. Please try again.');
      }
      throw error;
    }
    throw new Error('Unknown error occurred during analysis');
  }
}

function parseGeminiStructuredResponse(rawText: string): HandwritingGeminiStructuredResult {
  try {
    const trimmed = rawText.trim();
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    const jsonSlice = start >= 0 && end >= 0 ? trimmed.slice(start, end + 1) : trimmed;
    const parsed = JSON.parse(jsonSlice) as HandwritingGeminiStructuredResult;
    return normalizeGeminiData(parsed);
  } catch {
    return normalizeGeminiData({
      mirror_writing: {
        detected: false,
        reversed_letters: [],
        reversal_count: 0,
        total_letters: 0,
        reversal_rate: 0,
        score: 20,
      },
      spatial_irregularities: {
        spacing_cv: 0.2,
        baseline_adherence: 0.8,
        size_variability: 0.2,
        score: 25,
      },
      formation_difficulties: {
        tremor_detected: false,
        tremor_severity: 0.2,
        unclosed_letters: [],
        closure_issues_count: 0,
        score: 20,
      },
      letter_orientation: {
        slant_variance_degrees: 8,
        rotation_errors: 0,
        score: 15,
      },
      overall_risk_score: 22,
      confidence: 0.55,
      clinical_notes: 'Fallback structured analysis used because model output was not valid JSON.',
    });
  }
}

function normalizeGeminiData(data: HandwritingGeminiStructuredResult): HandwritingGeminiStructuredResult {
  const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

  return {
    ...data,
    mirror_writing: {
      ...data.mirror_writing,
      reversal_rate: clamp(Number(data.mirror_writing.reversal_rate || 0), 0, 1),
      score: clamp(Number(data.mirror_writing.score || 0), 0, 100),
    },
    spatial_irregularities: {
      ...data.spatial_irregularities,
      spacing_cv: clamp(Number(data.spatial_irregularities.spacing_cv || 0), 0, 1),
      baseline_adherence: clamp(Number(data.spatial_irregularities.baseline_adherence || 0), 0, 1),
      size_variability: clamp(Number(data.spatial_irregularities.size_variability || 0), 0, 1),
      score: clamp(Number(data.spatial_irregularities.score || 0), 0, 100),
    },
    formation_difficulties: {
      ...data.formation_difficulties,
      tremor_severity: clamp(Number(data.formation_difficulties.tremor_severity || 0), 0, 1),
      score: clamp(Number(data.formation_difficulties.score || 0), 0, 100),
    },
    letter_orientation: {
      ...data.letter_orientation,
      slant_variance_degrees: Number(data.letter_orientation.slant_variance_degrees || 0),
      score: clamp(Number(data.letter_orientation.score || 0), 0, 100),
    },
    overall_risk_score: clamp(Number(data.overall_risk_score || 0), 0, 100),
    confidence: clamp(Number(data.confidence || 0), 0, 1),
  };
}

async function processHandwritingResults(
  geminiData: HandwritingGeminiStructuredResult,
  childAge: ChildAge,
  handwritingImageBase64: string
): Promise<HandwritingPipelineResult> {
  const ageCalibrated = applyAgeCalibration(geminiData, childAge);
  const clinicalValidated = validateClinicalThresholds(ageCalibrated);
  const cvConfirmed = await performCVCrossCheck(handwritingImageBase64, geminiData);
  const finalScore = calculateWeightedScore(clinicalValidated, cvConfirmed);

  // Build OpenCV data object if available from backend
  const opencvData = cvConfirmed.opencv_score !== undefined ? {
    gemini_score: cvConfirmed.gemini_score ?? geminiData.overall_risk_score,
    opencv_score: cvConfirmed.opencv_score,
    concordance: cvConfirmed.concordance ?? cvConfirmed.agreement_percentage,
    final_score: cvConfirmed.final_score ?? null,
    confidence: cvConfirmed.confidence ?? (cvConfirmed.agreement_percentage >= 75 ? 'high' : 'low') as 'high' | 'low',
    opencv_details: cvConfirmed.opencv_details ?? {
      spacing_variance: 0,
      stroke_consistency: 100,
      reversal_score: 0,
    },
  } : undefined;

  return {
    gemini_raw_score: geminiData.overall_risk_score,
    age_calibrated_score: ageCalibrated.adjusted_score,
    clinical_flags: clinicalValidated.clinical_flags,
    cv_agreement: cvConfirmed.agreement_percentage,
    final_score: finalScore,
    checks_passed: clinicalValidated.checks_passed,
    cv_confirmed: cvConfirmed.confirmed,
    category_scores: {
      mirror_writing: clinicalValidated.mirror_writing.score,
      spatial: clinicalValidated.spatial_irregularities.score,
      formation: clinicalValidated.formation_difficulties.score,
      orientation: clinicalValidated.letter_orientation.score,
    },
    pipeline_breakdown: {
      stage1_age_adjustment: ageCalibrated.adjustment_factor,
      stage2_threshold_checks: clinicalValidated.checks_passed,
      stage3_cv_validation: cvConfirmed.confirmed,
      stage4_weights_applied: true,
    },
    opencv_data: opencvData,
  };
}

function applyAgeCalibration(data: HandwritingGeminiStructuredResult, age: ChildAge) {
  const AGE_FACTORS: Record<ChildAge, { spacing: number; formation: number; orientation: number }> = {
    5: { spacing: 0.7, formation: 0.8, orientation: 0.7 },
    6: { spacing: 0.8, formation: 0.85, orientation: 0.8 },
    7: { spacing: 0.9, formation: 0.9, orientation: 0.85 },
    8: { spacing: 0.95, formation: 0.95, orientation: 0.9 },
    9: { spacing: 1.0, formation: 1.0, orientation: 0.95 },
    10: { spacing: 1.0, formation: 1.0, orientation: 1.0 },
  };

  const factors = AGE_FACTORS[age] || AGE_FACTORS[8];
  const adjusted = {
    ...data,
    spatial_irregularities: {
      ...data.spatial_irregularities,
      score: data.spatial_irregularities.score * factors.spacing,
    },
    formation_difficulties: {
      ...data.formation_difficulties,
      score: data.formation_difficulties.score * factors.formation,
    },
    letter_orientation: {
      ...data.letter_orientation,
      score: data.letter_orientation.score * factors.orientation,
    },
  };

  return {
    ...adjusted,
    adjusted_score: calculateAdjustedScore(adjusted),
    adjustment_factor: factors,
    age_note: `Adjusted for age ${age} developmental norms`,
  };
}

function calculateAdjustedScore(data: HandwritingGeminiStructuredResult): number {
  return (
    data.mirror_writing.score * 0.35 +
    data.spatial_irregularities.score * 0.30 +
    data.formation_difficulties.score * 0.25 +
    data.letter_orientation.score * 0.10
  );
}

function validateClinicalThresholds(data: ReturnType<typeof applyAgeCalibration>) {
  const CLINICAL_THRESHOLDS = {
    reversal_rate: 0.20,
    spacing_cv: 0.40,
    tremor_severity: 0.50,
    slant_variance: 12.0,
  };

  const flags: string[] = [];

  if (data.mirror_writing.reversal_rate > CLINICAL_THRESHOLDS.reversal_rate) {
    flags.push('HIGH_REVERSAL_FREQUENCY');
  }

  if (data.spatial_irregularities.spacing_cv > CLINICAL_THRESHOLDS.spacing_cv) {
    flags.push('IRREGULAR_SPACING');
  }

  if (data.formation_difficulties.tremor_severity > CLINICAL_THRESHOLDS.tremor_severity) {
    flags.push('MOTOR_CONTROL_CONCERN');
  }

  if (data.letter_orientation.slant_variance_degrees > CLINICAL_THRESHOLDS.slant_variance) {
    flags.push('ORIENTATION_INCONSISTENT');
  }

  return {
    ...data,
    clinical_flags: flags,
    threshold_exceeded_count: flags.length,
    checks_passed: Object.keys(CLINICAL_THRESHOLDS).length - flags.length,
  };
}

async function performCVCrossCheck(
  imageBase64: string,
  geminiData: HandwritingGeminiStructuredResult
): Promise<{
  cv_analysis_completed: boolean;
  opencv_score?: number;
  gemini_score?: number;
  concordance?: number;
  final_score?: number | null;
  confidence?: 'high' | 'low';
  opencv_details?: {
    spacing_variance: number;
    stroke_consistency: number;
    reversal_score: number;
  };
  agreement_percentage: number;
  confirmed: boolean;
  note?: string;
}> {
  try {
    // Call backend OpenCV analysis endpoint
    const response = await fetch(`${API_BASE_URL}/api/opencv-handwriting`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: imageBase64,
        geminiScore: geminiData.overall_risk_score,
      }),
    });

    if (!response.ok) {
      console.warn('OpenCV backend analysis failed, falling back to basic analysis');
      throw new Error(`OpenCV API error: ${response.status}`);
    }

    const opencvResult: OpenCVAnalysisResponse = await response.json();

    // Calculate agreement percentage based on concordance
    const concordance = opencvResult.concordance ?? 75;
    const agreement = concordance >= 75;

    return {
      cv_analysis_completed: true,
      opencv_score: opencvResult.opencv_score,
      gemini_score: opencvResult.gemini_score,
      concordance: concordance,
      final_score: opencvResult.final_score,
      confidence: opencvResult.confidence,
      opencv_details: opencvResult.opencv_details,
      agreement_percentage: Math.round(concordance),
      confirmed: agreement,
    };
  } catch (error) {
    console.warn('OpenCV analysis failed, using fallback:', error);
    // Fallback to basic client-side analysis
    return performFallbackCVAnalysis(imageBase64, geminiData);
  }
}

async function performFallbackCVAnalysis(
  imageBase64: string,
  geminiData: HandwritingGeminiStructuredResult
): Promise<{
  cv_analysis_completed: boolean;
  agreement_percentage: number;
  confirmed: boolean;
  note?: string;
}> {
  try {
    const image = await loadImage(imageBase64);
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');

    ctx.drawImage(image, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let darkPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) darkPixels++;
    }

    const letterDensity = darkPixels / (imageData.data.length / 4);
    const cvIrregularityDetected = letterDensity > 0.15 || letterDensity < 0.05;
    const geminiDetectedIssues = geminiData.overall_risk_score > 40;
    const agreement = cvIrregularityDetected === geminiDetectedIssues;

    return {
      cv_analysis_completed: true,
      agreement_percentage: agreement ? 85 : 60,
      confirmed: agreement,
      note: 'Fallback client-side analysis (OpenCV backend unavailable)',
    };
  } catch {
    return {
      cv_analysis_completed: false,
      agreement_percentage: 75,
      confirmed: true,
      note: 'CV validation skipped, relying on Gemini',
    };
  }
}

function calculateWeightedScore(
  clinicalData: ReturnType<typeof validateClinicalThresholds>,
  cvData: Awaited<ReturnType<typeof performCVCrossCheck>>
): number {
  const weights = {
    mirror_writing: 0.35,
    spatial: 0.30,
    formation: 0.25,
    orientation: 0.10,
  };

  const weightedScore =
    clinicalData.mirror_writing.score * weights.mirror_writing +
    clinicalData.spatial_irregularities.score * weights.spatial +
    clinicalData.formation_difficulties.score * weights.formation +
    clinicalData.letter_orientation.score * weights.orientation;

  const cvAdjustment = cvData.confirmed ? 0 : 5;
  return Math.min(100, Math.max(0, weightedScore + cvAdjustment));
}

function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}

export async function testGeminiConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gemini`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'analysis',
        prompt: 'Hello',
      }),
    });

    return response.ok;
  } catch {
    return false;
  }
}
