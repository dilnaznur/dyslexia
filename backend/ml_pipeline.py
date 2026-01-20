"""
ML Pipeline for MindStep Dyslexia Detection.
Handles feature engineering from raw gaze data and prediction.
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple
from scipy.stats import entropy
from scipy.signal import find_peaks
import logging

from schemas import GazePoint, ReadingData, FeatureImportance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FeatureEngineer:
    """Extracts eye-tracking features from raw gaze data."""

    # Feature weights for weighted TVI score (from notebook ablation study)
    TVI_WEIGHTS = {
        'entropy_fixation_duration': 2.86,
        'autocorrelation': 2.86,
        'cv_inter_fixation_intervals': 1.43,
        'meta_variability': 0.50
    }

    # Fixation detection parameters
    FIXATION_RADIUS = 50  # pixels
    FIXATION_MIN_DURATION = 100  # milliseconds

    def __init__(self):
        """Initialize feature engineer."""
        self.feature_names = [
            'num_fixations',
            'mean_fixation_duration',
            'median_fixation_duration',
            'total_reading_time',
            'mean_fixation_x',
            'std_fixation_y',
            'entropy_fixation_duration',
            'autocorrelation',
            'cv_inter_fixation_intervals',
            'meta_variability',
            'tvi_score',
            'weighted_tvi_score'
        ]

    def extract_features(self, reading_data: ReadingData) -> np.ndarray:
        """
        Extract 12 features from raw gaze data.

        Args:
            reading_data: Raw eye-tracking data

        Returns:
            Feature vector (12 values) in exact model order
        """
        try:
            # Convert gaze points to numpy arrays
            gaze_array = np.array([
                [p.x, p.y, p.timestamp] for p in reading_data.gaze_points
            ])

            # Detect fixations from raw gaze points
            fixations = self._detect_fixations(gaze_array)

            if len(fixations) < 3:
                logger.warning(f"Only {len(fixations)} fixations detected, using defaults")
                return self._get_default_features()

            # Extract baseline features (6)
            baseline = self._extract_baseline_features(fixations, reading_data)

            # Extract TVI components (4)
            tvi_components = self._extract_tvi_features(fixations)

            # Calculate derived features (2)
            derived = self._calculate_derived_features(tvi_components)

            # Combine all features in exact order
            features = np.array([
                baseline['num_fixations'],
                baseline['mean_fixation_duration'],
                baseline['median_fixation_duration'],
                baseline['total_reading_time'],
                baseline['mean_fixation_x'],
                baseline['std_fixation_y'],
                tvi_components['entropy_fixation_duration'],
                tvi_components['autocorrelation'],
                tvi_components['cv_inter_fixation_intervals'],
                tvi_components['meta_variability'],
                derived['tvi_score'],
                derived['weighted_tvi_score']
            ])

            # Replace any NaN/Inf with 0 (as in original notebook)
            features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)

            logger.info(f"Extracted features: {dict(zip(self.feature_names, features))}")
            return features

        except Exception as e:
            logger.error(f"Feature extraction failed: {e}")
            return self._get_default_features()

    def _detect_fixations(self, gaze_array: np.ndarray) -> List[Dict]:
        """
        Detect fixations from raw gaze points using dispersion-based algorithm.

        Args:
            gaze_array: Nx3 array [x, y, timestamp]

        Returns:
            List of fixation dictionaries
        """
        fixations = []
        i = 0

        while i < len(gaze_array):
            # Start potential fixation window
            window_start = i
            window_end = i

            # Expand window while points are close together
            while window_end < len(gaze_array) - 1:
                window_points = gaze_array[window_start:window_end + 2, :2]  # x, y only

                # Calculate dispersion (max distance between any two points)
                if len(window_points) > 1:
                    distances = np.linalg.norm(
                        window_points[:, None] - window_points[None, :],
                        axis=2
                    )
                    max_dispersion = np.max(distances)

                    if max_dispersion > self.FIXATION_RADIUS:
                        break

                window_end += 1

            # Check if fixation duration meets minimum threshold
            duration = gaze_array[window_end, 2] - gaze_array[window_start, 2]

            if duration >= self.FIXATION_MIN_DURATION:
                fixation_points = gaze_array[window_start:window_end + 1]
                fixations.append({
                    'x': np.mean(fixation_points[:, 0]),
                    'y': np.mean(fixation_points[:, 1]),
                    'duration': duration,
                    'start_time': fixation_points[0, 2],
                    'end_time': fixation_points[-1, 2]
                })

            i = window_end + 1

        logger.info(f"Detected {len(fixations)} fixations")
        return fixations

    def _extract_baseline_features(
        self,
        fixations: List[Dict],
        reading_data: ReadingData
    ) -> Dict[str, float]:
        """Extract 6 baseline features."""
        durations = [f['duration'] for f in fixations]
        x_positions = [f['x'] for f in fixations]
        y_positions = [f['y'] for f in fixations]

        return {
            'num_fixations': float(len(fixations)),
            'mean_fixation_duration': np.mean(durations),
            'median_fixation_duration': np.median(durations),
            'total_reading_time': reading_data.reading_duration * 1000,  # Convert to ms
            'mean_fixation_x': np.mean(x_positions),
            'std_fixation_y': np.std(y_positions)
        }

    def _extract_tvi_features(self, fixations: List[Dict]) -> Dict[str, float]:
        """
        Extract 4 TVI (Temporal Variability Index) components.
        """
        durations = np.array([f['duration'] for f in fixations])

        # 1. Entropy of fixation duration distribution
        hist, _ = np.histogram(durations, bins=10, density=True)
        hist = hist[hist > 0]  # Remove zero bins
        entropy_val = entropy(hist) if len(hist) > 0 else 0.0

        # 2. Autocorrelation (lag-1)
        if len(durations) > 1:
            durations_normalized = (durations - np.mean(durations)) / (np.std(durations) + 1e-8)
            autocorr = np.correlate(
                durations_normalized[:-1],
                durations_normalized[1:],
                mode='valid'
            )[0] / (len(durations) - 1)
        else:
            autocorr = 0.0

        # 3. Coefficient of variation of inter-fixation intervals
        if len(fixations) > 1:
            intervals = [
                fixations[i+1]['start_time'] - fixations[i]['end_time']
                for i in range(len(fixations) - 1)
            ]
            intervals = np.array(intervals)
            cv_intervals = np.std(intervals) / (np.mean(intervals) + 1e-8)
        else:
            cv_intervals = 0.0

        # 4. Meta-variability (variability of variability)
        if len(durations) >= 10:
            # Split into windows and calculate CV for each window
            window_size = len(durations) // 5
            window_cvs = []
            for i in range(0, len(durations) - window_size, window_size):
                window = durations[i:i + window_size]
                if len(window) > 1:
                    cv = np.std(window) / (np.mean(window) + 1e-8)
                    window_cvs.append(cv)

            meta_var = np.std(window_cvs) if len(window_cvs) > 1 else 0.0
        else:
            meta_var = 0.0

        return {
            'entropy_fixation_duration': entropy_val,
            'autocorrelation': autocorr,
            'cv_inter_fixation_intervals': cv_intervals,
            'meta_variability': meta_var
        }

    def _calculate_derived_features(self, tvi_components: Dict[str, float]) -> Dict[str, float]:
        """Calculate 2 derived TVI scores."""
        # Simple TVI score (sum of components)
        tvi_score = sum(tvi_components.values())

        # Weighted TVI score (using ablation study weights)
        weighted_tvi_score = sum(
            tvi_components[key] * self.TVI_WEIGHTS[key]
            for key in tvi_components.keys()
        )

        return {
            'tvi_score': tvi_score,
            'weighted_tvi_score': weighted_tvi_score
        }

    def _get_default_features(self) -> np.ndarray:
        """Return default feature values for edge cases."""
        return np.zeros(12)

    def get_feature_importance_dict(self, features: np.ndarray) -> FeatureImportance:
        """
        Convert feature array to FeatureImportance object.
        Used for explainability in API response.
        """
        return FeatureImportance(
            num_fixations=float(features[0]),
            mean_fixation_duration=float(features[1]),
            median_fixation_duration=float(features[2]),
            total_reading_time=float(features[3]),
            mean_fixation_x=float(features[4]),
            std_fixation_y=float(features[5]),
            entropy_fixation_duration=float(features[6]),
            autocorrelation=float(features[7]),
            cv_inter_fixation_intervals=float(features[8]),
            meta_variability=float(features[9]),
            tvi_score=float(features[10]),
            weighted_tvi_score=float(features[11])
        )


class DyslexiaPredictor:
    """
    Main prediction class that loads the model and makes predictions.
    Supports both real ML model and mock fallback mode.
    """

    def __init__(self, model_path: str = None, scaler_path: str = None):
        """
        Initialize predictor with trained model and scaler.

        Args:
            model_path: Path to .pkl model file
            scaler_path: Path to .pkl scaler file
        """
        self.feature_engineer = FeatureEngineer()
        self.model = None
        self.scaler = None
        self.model_version = "1.0.0"

        # Attempt to load real model files
        if model_path and scaler_path:
            try:
                import joblib

                # Load model and scaler
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)

                # Validate model type
                if not hasattr(self.model, 'predict_proba'):
                    raise ValueError("Model must have predict_proba method")

                # Validate scaler
                if not hasattr(self.scaler, 'transform'):
                    raise ValueError("Scaler must have transform method")

                self.model_version = "1.0.0-real"
                logger.info(f"✅ Model loaded successfully: {model_path}")
                logger.info(f"✅ Scaler loaded successfully: {scaler_path}")
                logger.info("🚀 Running in REAL MODEL mode (85.71% accuracy)")

            except FileNotFoundError as e:
                logger.warning(f"⚠️ Model files not found: {e}")
                logger.warning("⚠️ Falling back to MOCK mode")
                self.model = None
                self.scaler = None

            except Exception as e:
                logger.error(f"❌ Model loading failed: {e}")
                logger.warning("⚠️ Falling back to MOCK mode")
                self.model = None
                self.scaler = None
        else:
            logger.warning("⚠️ No model paths provided - using MOCK mode")

        if self.model is None:
            logger.warning("⚠️ Using MOCK predictor - provide model files for real predictions!")

    def predict(self, reading_data: ReadingData) -> Tuple[float, float, np.ndarray]:
        """
        Make dyslexia risk prediction.

        Args:
            reading_data: Eye-tracking assessment data

        Returns:
            Tuple of (probability_dyslexic, confidence, features)
        """
        # Extract features
        features = self.feature_engineer.extract_features(reading_data)
        features_2d = features.reshape(1, -1)

        probability_dyslexic = None
        confidence = None

        # Use REAL MODEL if available
        if self.model is not None and self.scaler is not None:
            try:
                # Validate feature count
                if features_2d.shape[1] != 12:
                    raise ValueError(f"Expected 12 features, got {features_2d.shape[1]}")

                # Scale features using fitted scaler
                features_scaled = self.scaler.transform(features_2d)

                # Get prediction probabilities
                prediction_proba = self.model.predict_proba(features_scaled)[0]

                # Extract probabilities for both classes
                probability_control = float(prediction_proba[0])      # Class 0: Non-dyslexic
                probability_dyslexic = float(prediction_proba[1])     # Class 1: Dyslexic

                # Confidence is the maximum probability
                confidence = float(max(prediction_proba))

                logger.info(
                    f"✅ Real model prediction: "
                    f"Dyslexic={probability_dyslexic:.3f}, "
                    f"Control={probability_control:.3f}, "
                    f"Confidence={confidence:.3f}"
                )

            except Exception as e:
                logger.error(f"❌ Real model prediction failed: {e}", exc_info=True)
                logger.warning("⚠️ Falling back to MOCK prediction")
                # Set model to None to trigger mock fallback
                self.model = None

        # MOCK PREDICTION FALLBACK (if model not loaded or prediction failed)
        if probability_dyslexic is None:
            logger.warning("⚠️ Using MOCK prediction logic")

            # Rule-based mock: High TVI scores -> higher risk
            weighted_tvi = features[11]  # weighted_tvi_score
            mean_fixation_dur = features[1]  # mean_fixation_duration

            # Normalize and combine (simplified heuristic)
            risk_indicator = (
                min(weighted_tvi / 10.0, 1.0) * 0.6 +
                min(mean_fixation_dur / 500.0, 1.0) * 0.4
            )

            probability_dyslexic = min(max(risk_indicator, 0.1), 0.95)
            confidence = 0.85 + np.random.uniform(-0.1, 0.1)  # Mock confidence
            confidence = min(max(confidence, 0.7), 0.99)

            logger.info(f"Mock prediction: {probability_dyslexic:.3f}, Confidence: {confidence:.3f}")

        return probability_dyslexic, confidence, features

    def generate_explanation(
        self,
        features: np.ndarray,
        probability: float
    ) -> Tuple[List[str], str]:
        """
        Generate explainable AI output.

        Args:
            features: Feature vector
            probability: Predicted probability

        Returns:
            Tuple of (primary_indicators, recommendation)
        """
        indicators = []

        # Analyze key features
        mean_fix_dur = features[1]
        median_fix_dur = features[2]
        entropy_val = features[6]
        autocorr = features[7]
        weighted_tvi = features[11]

        # Generate human-readable indicators
        if mean_fix_dur > 300:
            indicators.append(
                f"Increased fixation duration (avg {mean_fix_dur:.0f}ms vs typical 200-250ms)"
            )

        if entropy_val > 2.0:
            indicators.append(
                "High variability in reading patterns (entropy: {:.2f})".format(entropy_val)
            )

        if autocorr < -0.2:
            indicators.append(
                "Irregular temporal reading rhythm detected"
            )

        if weighted_tvi > 8.0:
            indicators.append(
                "Elevated temporal variability index (TVI: {:.2f})".format(weighted_tvi)
            )

        if len(indicators) == 0:
            indicators.append("Reading patterns within typical range")

        # Generate recommendation
        if probability >= 0.7:
            recommendation = (
                "High risk detected. Recommend comprehensive psychoeducational "
                "assessment by qualified professional within 2-4 weeks."
            )
        elif probability >= 0.4:
            recommendation = (
                "Moderate risk detected. Consider follow-up screening and "
                "consultation with reading specialist."
            )
        else:
            recommendation = (
                "Low risk detected. Continue monitoring reading development "
                "through regular assessments."
            )

        return indicators, recommendation
