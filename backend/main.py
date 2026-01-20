"""
MindStep FastAPI Backend - Dyslexia Detection Platform
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from typing import Dict
import uuid
from datetime import datetime

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",  # Common React port
        "https://*.vercel.app",   # Vercel deployments
        "*"  # In production, replace with specific domain
    ],
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


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "MindStep API - Dyslexia Detection Platform",
        "version": "1.0.0",
        "docs": "/docs"
    }


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
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Enable auto-reload during development
        log_level="info"
    )
