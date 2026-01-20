"""
Pydantic schemas for MindStep API request/response validation.
"""
from typing import Dict, List
from pydantic import BaseModel, Field, validator


class GazePoint(BaseModel):
    """Single gaze point from eye-tracking."""
    x: float = Field(..., description="Horizontal position (pixels)")
    y: float = Field(..., description="Vertical position (pixels)")
    timestamp: float = Field(..., description="Timestamp (milliseconds)")


class ReadingData(BaseModel):
    """Eye-tracking data collected during reading assessment."""
    gaze_points: List[GazePoint] = Field(..., min_items=10, description="Raw gaze data points")
    text_length: int = Field(..., gt=0, description="Number of words in the passage")
    reading_duration: float = Field(..., gt=0, description="Total reading time (seconds)")

    @validator('gaze_points')
    def validate_gaze_points(cls, v):
        if len(v) < 10:
            raise ValueError('Minimum 10 gaze points required for analysis')
        return v


class PredictionRequest(BaseModel):
    """Request payload for dyslexia risk prediction."""
    reading_data: ReadingData = Field(..., description="Eye-tracking reading assessment data")

    class Config:
        json_schema_extra = {
            "example": {
                "reading_data": {
                    "gaze_points": [
                        {"x": 150.5, "y": 200.3, "timestamp": 1000},
                        {"x": 170.2, "y": 205.1, "timestamp": 1250},
                        {"x": 190.8, "y": 202.7, "timestamp": 1500}
                    ],
                    "text_length": 50,
                    "reading_duration": 45.5
                }
            }
        }


class FeatureImportance(BaseModel):
    """Feature importance scores for explainability."""
    num_fixations: float
    mean_fixation_duration: float
    median_fixation_duration: float
    total_reading_time: float
    mean_fixation_x: float
    std_fixation_y: float
    entropy_fixation_duration: float
    autocorrelation: float
    cv_inter_fixation_intervals: float
    meta_variability: float
    tvi_score: float
    weighted_tvi_score: float


class Explanation(BaseModel):
    """Explainable AI output."""
    primary_indicators: List[str] = Field(..., description="Key risk factors identified")
    feature_importance: FeatureImportance = Field(..., description="Contribution of each feature")
    recommendation: str = Field(..., description="Clinical recommendation")


class PredictionResponse(BaseModel):
    """Response from dyslexia prediction endpoint."""
    risk_score: float = Field(..., ge=0, le=100, description="Dyslexia risk score (0-100)")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence (0-1)")
    classification: str = Field(..., description="Risk category: Low/Moderate/High Risk")
    explanation: Explanation = Field(..., description="Explainable AI details")
    model_version: str = Field(default="1.0.0", description="Model version identifier")

    class Config:
        json_schema_extra = {
            "example": {
                "risk_score": 72.5,
                "confidence": 0.94,
                "classification": "High Risk",
                "explanation": {
                    "primary_indicators": [
                        "Increased fixation duration (avg 320ms vs typical 250ms)",
                        "High reading time variability",
                        "Irregular saccade patterns"
                    ],
                    "feature_importance": {
                        "mean_fixation_duration": 0.28,
                        "entropy_fixation_duration": 0.22,
                        "autocorrelation": 0.18
                    },
                    "recommendation": "Recommend comprehensive assessment by educational psychologist"
                },
                "model_version": "1.0.0"
            }
        }


class FeedbackRequest(BaseModel):
    """Feedback submission for model improvement."""
    prediction_id: str = Field(..., description="Unique prediction identifier")
    actual_diagnosis: bool = Field(..., description="True diagnosis (True=Dyslexic, False=Not Dyslexic)")
    clinician_notes: str | None = Field(None, description="Optional clinical notes")


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(default="healthy")
    model_loaded: bool
    version: str
