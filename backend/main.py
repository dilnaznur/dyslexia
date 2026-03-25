"""
MindStep FastAPI Backend - Dyslexia Detection Platform
"""
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import Dict, List, Tuple
import uuid
from datetime import datetime
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path
import base64
import numpy as np
import cv2

# Явно указываем путь к .env
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Добавьте для отладки
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"🔑 API Key loaded: {'Yes' if GEMINI_API_KEY else 'NO - CHECK .env FILE'}")
if GEMINI_API_KEY:
    print(f"   First 10 chars: {GEMINI_API_KEY[:10]}...")

from schemas import (
    PredictionRequest,
    PredictionResponse,
    FeedbackRequest,
    HealthResponse,
    Explanation,
    FeatureImportance
)
from ml_pipeline import DyslexiaPredictor
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MindStep API",
    description="Clinical-grade AI platform for early dyslexia detection",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for React frontend
# FRONTEND_URL can be set to a specific Vercel deployment URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "")

cors_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
if FRONTEND_URL:
    cors_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model file paths
MODEL_DIR = Path(__file__).parent / "models"
ETDD70_MODEL_PATH = MODEL_DIR / "etdd70_model.pkl"

# Initialize ML predictor with real model files (if available)
predictor = DyslexiaPredictor(
    model_path=str(ETDD70_MODEL_PATH) if ETDD70_MODEL_PATH.exists() else None
)

# In-memory storage for feedback (in production, use database)
feedback_store: Dict[str, Dict] = {}

# Gemini API configuration

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "MindStep API - Dyslexia Detection Platform",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.api_route("/healthz", methods=["GET", "HEAD"], include_in_schema=False)
async def healthz_check():
    """Lightweight liveness endpoint for uptime pings."""
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event():
    """Log startup information and model status."""
    logger.info("=" * 60)
    logger.info("MindStep API - Dyslexia Detection Platform")
    logger.info("=" * 60)
    logger.info(f"Looking for model at: {ETDD70_MODEL_PATH}")
    logger.info(f"File exists: {ETDD70_MODEL_PATH.exists()}")

    if predictor.model_loaded:
        logger.info("🚀 Server started with REAL ML model")
        logger.info("Model: Ensemble CatBoost+XGB+LightGBM")
        logger.info("Accuracy: 92.86%  |  AUC: 0.9796")
        logger.info(f"   Version: {predictor.model_version}")
    else:
        logger.warning("🚀 Server started in MOCK mode")
        logger.warning("   Place model file in backend/models/ for real predictions:")
        logger.warning(f"   - {ETDD70_MODEL_PATH}")

    logger.info("=" * 60)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring.
    Returns service status and model availability.
    """
    try:
        return HealthResponse(
            status="healthy",
            model_loaded=predictor.model_loaded,
            version=predictor.model_version
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unhealthy"
        )


@app.post(
    "/api/v1/predict",
    response_model=PredictionResponse,
    tags=["Prediction"],
    status_code=status.HTTP_200_OK
)
async def predict_dyslexia_risk(request: PredictionRequest):
    """
    Predict dyslexia risk from eye-tracking reading assessment.

    **Process:**
    1. Extract 12 features from raw gaze data
    2. Apply trained Random Forest model
    3. Generate risk score (0-100) and classification
    4. Provide explainable AI insights

    **Response:**
    - **risk_score**: 0-100 scale (higher = greater risk)
    - **confidence**: Model certainty (0-1)
    - **classification**: Low Risk (<40) | Moderate Risk (40-70) | High Risk (>70)
    - **explanation**: Primary indicators and recommendations
    """
    try:
        logger.info(f"Received prediction request with {len(request.reading_data.gaze_points)} gaze points")

        # Validate input
        if len(request.reading_data.gaze_points) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient gaze data. Minimum 10 points required."
            )

        probability, confidence, feature_dict = predictor.predict(request.reading_data)
        risk_score = probability * 100

        if risk_score < 40:
            classification = "Low Risk"
        elif risk_score < 70:
            classification = "Moderate Risk"
        else:
            classification = "High Risk"

        primary_indicators, recommendation = predictor.generate_explanation(
            feature_dict, probability)

        feature_importance = FeatureImportance(
            fix_count=feature_dict.get("fix_count", 0.0),
            fix_dur_mean=feature_dict.get("fix_dur_mean", 0.0),
            fix_dur_std=feature_dict.get("fix_dur_std", 0.0),
            fix_x_mean=feature_dict.get("fix_x_mean", 0.0),
            fix_y_std=feature_dict.get("fix_y_std", 0.0),
            raw_vel_mean=feature_dict.get("raw_vel_mean", 0.0),
            raw_regressions=feature_dict.get("raw_regressions", 0.0),
            raw_path_length=feature_dict.get("raw_path_length", 0.0),
        )

        response = PredictionResponse(
            risk_score=round(risk_score, 2),
            confidence=round(confidence, 3),
            classification=classification,
            explanation=Explanation(
                primary_indicators=primary_indicators,
                feature_importance=feature_importance,
                recommendation=recommendation,
            ),
            model_version=predictor.model_version,
        )

        return response

        logger.info(
            f"Prediction completed: risk={risk_score:.1f}%, "
            f"confidence={confidence:.2f}, class={classification}"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@app.post("/api/v1/feedback", tags=["Feedback"], status_code=status.HTTP_201_CREATED)
async def submit_feedback(feedback: FeedbackRequest):
    """
    Submit clinical feedback for model improvement.

    **Purpose:**
    Collect real-world diagnostic outcomes to retrain and improve the model.

    **Data Stored:**
    - Prediction ID
    - Actual diagnosis (ground truth)
    - Optional clinician notes
    """
    try:
        feedback_id = str(uuid.uuid4())

        feedback_store[feedback_id] = {
            "prediction_id": feedback.prediction_id,
            "actual_diagnosis": feedback.actual_diagnosis,
            "clinician_notes": feedback.clinician_notes,
            "timestamp": datetime.utcnow().isoformat(),
            "feedback_id": feedback_id
        }

        logger.info(f"Feedback stored: {feedback_id}")

        return {
            "message": "Feedback received successfully",
            "feedback_id": feedback_id,
            "status": "stored"
        }

    except Exception as e:
        logger.error(f"Feedback submission error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store feedback"
        )


@app.get("/api/v1/stats", tags=["Analytics"])
async def get_statistics():
    """
    Get platform usage statistics.
    (In production, connect to analytics database)
    """
    return {
        "total_assessments": 0,  # Mock data
        "feedback_submissions": len(feedback_store),
        "model_accuracy": 0.857,  # From training (85.7%)
        "high_confidence_accuracy": 0.941,  # 94.1% at >0.90 confidence
        "uptime": "99.9%"
    }


@app.post("/api/gemini", tags=["Gemini AI"])
async def gemini_proxy(request: dict):
    """
    Proxy endpoint for Gemini API requests (vision, chat, analysis).
    Handles handwriting analysis and AI-powered assessments.
    """
    try:
        # Логируем что получили
        logger.info(f"Gemini request type: {request.get('type')}")
        logger.info(f"API Key available: {bool(GEMINI_API_KEY)}")
        if GEMINI_API_KEY:
            logger.info(f"API Key first 10 chars: {GEMINI_API_KEY[:10]}...")
        
        request_type = request.get("type")

        if request_type == "vision":
            prompt = request.get("prompt")
            image_base64 = request.get("imageBase64", "").split(",")[-1]

            body = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {
                            "inline_data": {
                                "mime_type": "image/jpeg",
                                "data": image_base64
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "topK": 32,
                    "topP": 0.95,
                    "maxOutputTokens": 1024
                }
            }

        elif request_type == "chat":
            raw_messages = request.get("messages", [])

            if not raw_messages:
                raise HTTPException(status_code=400, detail="Messages array is empty")

            messages = []
            for msg in raw_messages:
                if "role" in msg and "content" in msg:
                    # Gemini uses 'user' and 'model', not 'assistant'
                    role = "model" if msg["role"] == "assistant" else msg["role"]
                    messages.append({
                        "role": role,
                        "parts": [{"text": msg["content"]}]
                    })

            # Gemini requires last message to be from 'user'
            if messages and messages[-1]["role"] != "user":
                logger.warning("Last message is not from user, removing it")
                messages = messages[:-1]

            if not messages:
                raise HTTPException(status_code=400, detail="No valid user messages found")

            body = {
                "contents": messages,
                "generationConfig": {
                    "temperature": 0.7,
                    "topK": 40,
                    "topP": 0.95,
                    "maxOutputTokens": 512
                }
            }

        elif request_type == "analysis":
            prompt = request.get("prompt")

            body = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "temperature": 0.2,
                    "topK": 32,
                    "topP": 0.95,
                    "maxOutputTokens": 4096
                }
            }

        else:
            raise HTTPException(status_code=400, detail="Invalid request type")

        # Логируем URL который используем
        api_url = f"{GEMINI_API_BASE}/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
        logger.info(f"Calling Gemini API: {api_url[:80]}...")  # Показываем начало URL
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                api_url,
                json=body,
                timeout=30.0
            )
        
        logger.info(f"Gemini response status: {response.status_code}")
        
        if response.status_code == 429:
            logger.warning("Rate limit exceeded, waiting...")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a moment and try again."
            )

        if response.status_code != 200:
            error_text = response.text
            logger.error(f"Gemini API error {response.status_code}: {error_text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Gemini API error: {error_text}"
            )
        
        return response.json()

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Gemini API error: {e}", exc_info=True)  # exc_info=True покажет полный traceback
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")


# ============================================================================
# OpenCV Handwriting Analysis
# ============================================================================

def analyze_handwriting_opencv(image_bytes: bytes) -> dict:
    """
    Analyze handwriting image using OpenCV to extract objective metrics.

    Returns:
        dict with spacing_variance, stroke_consistency, reversal_score, and overall_score
    """
    # Decode image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Failed to decode image")

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Apply Otsu's thresholding for better binarization
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Find contours (connected components representing letters/strokes)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Filter out noise (too small contours)
    min_area = 50
    valid_contours = [c for c in contours if cv2.contourArea(c) > min_area]

    if len(valid_contours) < 2:
        # Not enough content to analyze
        return {
            "spacing_variance": 0.0,
            "stroke_consistency": 100.0,
            "reversal_score": 0.0,
            "overall_score": 25.0,  # Conservative low score for sparse content
            "contour_count": len(valid_contours),
            "analysis_note": "Insufficient handwriting content for detailed analysis"
        }

    # -------------------------------------------------------------------------
    # 1. Letter Spacing Variance (std deviation of gaps between components)
    # -------------------------------------------------------------------------
    bounding_boxes = [cv2.boundingRect(c) for c in valid_contours]
    # Sort by x-coordinate (left to right)
    bounding_boxes.sort(key=lambda b: b[0])

    gaps = []
    for i in range(1, len(bounding_boxes)):
        prev_x, _, prev_w, _ = bounding_boxes[i-1]
        curr_x, _, _, _ = bounding_boxes[i]
        gap = curr_x - (prev_x + prev_w)
        if gap > 0:  # Only consider positive gaps
            gaps.append(gap)

    if len(gaps) > 1:
        spacing_mean = np.mean(gaps)
        spacing_std = np.std(gaps)
        # Coefficient of variation for spacing
        spacing_cv = (spacing_std / spacing_mean * 100) if spacing_mean > 0 else 0
        spacing_variance = min(100, spacing_cv)  # Cap at 100
    else:
        spacing_variance = 0.0

    # -------------------------------------------------------------------------
    # 2. Stroke Width Consistency (std deviation of contour line widths)
    # -------------------------------------------------------------------------
    stroke_widths = []
    for contour in valid_contours:
        # Calculate approximate stroke width using area/perimeter ratio
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        if perimeter > 0:
            # This approximates average stroke width
            width_estimate = area / perimeter * 2
            stroke_widths.append(width_estimate)

    if len(stroke_widths) > 1:
        stroke_mean = np.mean(stroke_widths)
        stroke_std = np.std(stroke_widths)
        # Higher consistency = lower std deviation relative to mean
        stroke_cv = (stroke_std / stroke_mean * 100) if stroke_mean > 0 else 0
        # Convert to consistency score (100 = perfectly consistent)
        stroke_consistency = max(0, 100 - min(100, stroke_cv))
    else:
        stroke_consistency = 100.0

    # -------------------------------------------------------------------------
    # 3. Reversal Detection Score (horizontal symmetry analysis)
    # -------------------------------------------------------------------------
    reversal_scores = []
    for contour in valid_contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w < 10 or h < 10:  # Skip tiny components
            continue

        # Extract ROI
        roi = binary[y:y+h, x:x+w]

        # Flip horizontally
        flipped = cv2.flip(roi, 1)

        # Calculate similarity using moments
        moments_original = cv2.moments(roi)
        moments_flipped = cv2.moments(flipped)

        # Hu moments for shape comparison (scale/rotation invariant)
        hu_original = cv2.HuMoments(moments_original).flatten()
        hu_flipped = cv2.HuMoments(moments_flipped).flatten()

        # Log transform for better comparison
        hu_original = -np.sign(hu_original) * np.log10(np.abs(hu_original) + 1e-10)
        hu_flipped = -np.sign(hu_flipped) * np.log10(np.abs(hu_flipped) + 1e-10)

        # Calculate similarity (lower = more symmetric = potential reversal)
        similarity = np.sum(np.abs(hu_original - hu_flipped))

        # Very symmetric shapes might be reversed letters (b/d, p/q)
        # Scores below 0.5 indicate high symmetry
        if similarity < 0.5:
            reversal_scores.append(100 - similarity * 200)  # High symmetry = high reversal risk
        else:
            reversal_scores.append(max(0, 50 - similarity * 10))

    if reversal_scores:
        reversal_score = np.mean(reversal_scores)
    else:
        reversal_score = 0.0

    # -------------------------------------------------------------------------
    # 4. Overall Regularity Score (0-100, derived from above metrics)
    # -------------------------------------------------------------------------
    # Weights: spacing irregularity is concerning (40%), stroke inconsistency (35%), reversals (25%)
    # Lower is better for spacing variance and reversal; higher is better for consistency

    # Normalize scores: convert all to "risk" scores where higher = more concerning
    spacing_risk = spacing_variance  # Already 0-100, higher = more variance = more risk
    consistency_risk = 100 - stroke_consistency  # Convert: low consistency = high risk
    reversal_risk = reversal_score  # Already 0-100, higher = more reversals

    # Calculate overall risk score (weighted average)
    overall_risk = (spacing_risk * 0.40 + consistency_risk * 0.35 + reversal_risk * 0.25)
    overall_score = min(100, max(0, overall_risk))

    return {
        "spacing_variance": round(spacing_variance, 2),
        "stroke_consistency": round(stroke_consistency, 2),
        "reversal_score": round(reversal_score, 2),
        "overall_score": round(overall_score, 2),
        "contour_count": len(valid_contours),
        "analysis_note": "Full OpenCV analysis completed"
    }


@app.post("/api/opencv-handwriting", tags=["OpenCV Analysis"])
async def opencv_handwriting_analysis(request: dict):
    """
    Analyze handwriting image using OpenCV computer vision.

    Accepts base64-encoded image and returns objective CV metrics:
    - spacing_variance: Variability in letter spacing (0-100, lower = more regular)
    - stroke_consistency: Consistency of stroke widths (0-100, higher = more consistent)
    - reversal_score: Detection of potentially reversed letters (0-100, higher = more reversals)
    - overall_score: Combined dyslexia risk indicator (0-100)
    """
    try:
        image_base64 = request.get("imageBase64", "")
        gemini_score = request.get("geminiScore", None)

        if not image_base64:
            raise HTTPException(status_code=400, detail="Missing imageBase64 in request")

        # Remove data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",")[-1]

        # Decode base64 to bytes
        try:
            image_bytes = base64.b64decode(image_base64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

        # Run OpenCV analysis
        opencv_result = analyze_handwriting_opencv(image_bytes)

        # Calculate concordance if Gemini score is provided
        if gemini_score is not None:
            try:
                gemini_score = float(gemini_score)
                opencv_score = opencv_result["overall_score"]

                # Concordance: how close are the two scores (100 = perfect agreement)
                concordance = 100 - abs(gemini_score - opencv_score)

                # Determine confidence level
                if concordance >= 75:
                    confidence = "high"
                    # Weighted average: Gemini 70%, OpenCV 30%
                    final_score = gemini_score * 0.7 + opencv_score * 0.3
                else:
                    confidence = "low"
                    # Return both scores separately
                    final_score = None

                response = {
                    "gemini_score": round(gemini_score, 2),
                    "opencv_score": round(opencv_score, 2),
                    "concordance": round(concordance, 2),
                    "final_score": round(final_score, 2) if final_score is not None else None,
                    "confidence": confidence,
                    "opencv_details": {
                        "spacing_variance": opencv_result["spacing_variance"],
                        "stroke_consistency": opencv_result["stroke_consistency"],
                        "reversal_score": opencv_result["reversal_score"]
                    },
                    "contour_count": opencv_result["contour_count"],
                    "analysis_note": opencv_result["analysis_note"]
                }
            except (ValueError, TypeError):
                # If gemini_score is invalid, return just OpenCV results
                response = {
                    "opencv_score": opencv_result["overall_score"],
                    "opencv_details": {
                        "spacing_variance": opencv_result["spacing_variance"],
                        "stroke_consistency": opencv_result["stroke_consistency"],
                        "reversal_score": opencv_result["reversal_score"]
                    },
                    "contour_count": opencv_result["contour_count"],
                    "analysis_note": opencv_result["analysis_note"]
                }
        else:
            response = {
                "opencv_score": opencv_result["overall_score"],
                "opencv_details": {
                    "spacing_variance": opencv_result["spacing_variance"],
                    "stroke_consistency": opencv_result["stroke_consistency"],
                    "reversal_score": opencv_result["reversal_score"]
                },
                "contour_count": opencv_result["contour_count"],
                "analysis_note": opencv_result["analysis_note"]
            }

        logger.info(f"OpenCV analysis completed: score={opencv_result['overall_score']}")
        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OpenCV analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"OpenCV analysis failed: {str(e)}")


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler for unhandled errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected error occurred. Please try again.",
            "error_type": type(exc).__name__
        }
    )
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
