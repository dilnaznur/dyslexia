"""
MindStep FastAPI Backend - Dyslexia Detection Platform
"""
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import Dict
import uuid
from datetime import datetime
import httpx
import os
from dotenv import load_dotenv
from pathlib import Path

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
    Explanation
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
MODEL_PATH = MODEL_DIR / "optimal_tvi_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"

# Initialize ML predictor with real model files (if available)
predictor = DyslexiaPredictor(
    model_path=str(MODEL_PATH) if MODEL_PATH.exists() else None,
    scaler_path=str(SCALER_PATH) if SCALER_PATH.exists() else None
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

    if predictor.model is not None:
        logger.info("🚀 Server started with REAL ML model")
        logger.info("   Model: Random Forest (85.71% accuracy, 94.1% @ high confidence)")
        logger.info(f"   Version: {predictor.model_version}")
    else:
        logger.warning("🚀 Server started in MOCK mode")
        logger.warning("   Place model files in backend/models/ for real predictions:")
        logger.warning(f"   - {MODEL_PATH}")
        logger.warning(f"   - {SCALER_PATH}")

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
            model_loaded=(predictor.model is not None),
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

        # Make prediction
        probability_dyslexic, confidence, features = predictor.predict(
            request.reading_data
        )

        # Convert probability to risk score (0-100)
        risk_score = probability_dyslexic * 100

        # Classify risk level
        if risk_score < 40:
            classification = "Low Risk"
        elif risk_score < 70:
            classification = "Moderate Risk"
        else:
            classification = "High Risk"

        # Generate explanation
        primary_indicators, recommendation = predictor.generate_explanation(
            features, probability_dyslexic
        )

        # Get feature importance for explainability
        feature_importance = predictor.feature_engineer.get_feature_importance_dict(
            features
        )

        # Build response
        response = PredictionResponse(
            risk_score=round(risk_score, 2),
            confidence=round(confidence, 3),
            classification=classification,
            explanation=Explanation(
                primary_indicators=primary_indicators,
                feature_importance=feature_importance,
                recommendation=recommendation
            ),
            model_version=predictor.model_version
        )

        logger.info(
            f"Prediction completed: risk={risk_score:.1f}%, "
            f"confidence={confidence:.2f}, class={classification}"
        )

        return response

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
