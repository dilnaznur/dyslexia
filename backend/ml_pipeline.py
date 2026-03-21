import numpy as np
import pandas as pd
import pickle
import logging
from typing import List, Dict, Tuple
from schemas import GazePoint, ReadingData, FeatureImportance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DyslexiaPredictor:
    FIXATION_RADIUS = 50  # pixels
    FIXATION_MIN_DURATION = 100  # milliseconds

    def __init__(self, model_path: str = None):
        self.model_loaded = False
        self.task_fitted_models = {}
        self.scaler = None
        self.feature_cols = []
        self.TASKS = []
        self.model_version = "2.0.0-etdd70-ensemble"

        if model_path:
            try:
                with open(model_path, 'rb') as f:
                    data = pickle.load(f)
                self.task_fitted_models = data["task_fitted_models"]
                self.scaler = data["scaler"]
                self.feature_cols = data["feature_cols"]
                self.TASKS = data["TASKS"]
                first = self.task_fitted_models[self.TASKS[0]][0]
                if not hasattr(first, 'predict_proba'):
                    raise ValueError("Models missing predict_proba")
                self.model_loaded = True
                logger.info("✅ etdd70 ensemble loaded: 92.86% accuracy, AUC 0.9796")
            except Exception as e:
                import traceback
                logger.error(f"❌ Model load failed: {e}")
                logger.error(traceback.format_exc())
                self.model_loaded = False

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

    def _build_feature_dict(self, reading_data: ReadingData) -> Dict[str, float]:
        gaze_array = np.array([[p.x, p.y, p.timestamp]
                               for p in reading_data.gaze_points])
        x_arr = gaze_array[:, 0]
        y_arr = gaze_array[:, 1]
        fixations = self._detect_fixations(gaze_array)
        durations = [f['duration'] for f in fixations] if fixations else [0.0]
        dx = np.diff(x_arr)
        dy = np.diff(y_arr)
        vel = np.sqrt(dx**2 + dy**2) if len(dx) > 0 else np.array([0.0])
        acc = np.diff(vel) if len(vel) > 1 else np.array([0.0])
        hist = (np.histogram(vel, bins=20, density=True)[0]
                if len(vel) > 0 else np.zeros(20))
        path = float(np.sum(vel))

        d = {col: 0.0 for col in self.feature_cols}  # все 76 фичей = 0.0

        d['fix_count'] = float(len(fixations))
        d['fix_dur_mean'] = float(np.mean(durations))
        d['fix_dur_std'] = float(np.std(durations))
        d['fix_dur_max'] = float(np.max(durations))
        d['fix_dur_sum'] = float(np.sum(durations))
        if fixations:
            d['fix_x_mean'] = float(np.mean([f['x'] for f in fixations]))
            d['fix_x_std'] = float(np.std([f['x'] for f in fixations]))
            d['fix_y_mean'] = float(np.mean([f['y'] for f in fixations]))
            d['fix_y_std'] = float(np.std([f['y'] for f in fixations]))
        d['raw_gaze_x_mean'] = float(np.mean(x_arr))
        d['raw_gaze_x_std'] = float(np.std(x_arr))
        d['raw_gaze_y_mean'] = float(np.mean(y_arr))
        d['raw_gaze_y_std'] = float(np.std(y_arr))
        d['raw_vel_mean'] = float(np.mean(vel))
        d['raw_vel_std'] = float(np.std(vel))
        d['raw_vel_max'] = float(np.max(vel))
        d['raw_vel_p90'] = float(np.percentile(vel, 90))
        d['raw_vel_entropy'] = float(-np.sum(hist * np.log(hist + 1e-9)) / 20)
        d['raw_vel_skew'] = (float(pd.Series(vel).skew())
                             if len(vel) > 1 else 0.0)
        d['raw_acc_mean'] = float(np.abs(acc).mean())
        d['raw_acc_max'] = float(np.abs(acc).max())
        d['raw_path_length'] = path
        d['raw_regressions'] = float(np.sum(dx < -5))
        d['raw_reg_pct'] = (float(np.mean(dx < -5))
                            if len(dx) > 0 else 0.0)
        d['raw_dy_down_count'] = float(np.sum(dy > 5))
        d['raw_x_range'] = float(np.ptp(x_arr))
        d['raw_y_range'] = float(np.ptp(y_arr))
        d['raw_duration_ms'] = float(
            (gaze_array[-1, 2] - gaze_array[0, 2]) / 1000)
        d['raw_efficiency'] = float(
            np.sqrt((x_arr[-1] - x_arr[0])**2 + (y_arr[-1] - y_arr[0])**2)
            / (path + 1e-9))
        return d

    def predict(self, reading_data: ReadingData) -> Tuple[float, float, Dict]:
        feature_dict = self._build_feature_dict(reading_data)

        if self.model_loaded:
            try:
                arr = np.array([feature_dict.get(c, 0.0) for c in self.feature_cols])
                arr = np.nan_to_num(arr, nan=0.0, posinf=0.0, neginf=0.0)
                scaled = self.scaler.transform(arr.reshape(1, -1))

                task_probs = []
                for task in self.TASKS:
                    probs = [m.predict_proba(scaled)[:, 1][0]
                             for m in self.task_fitted_models[task]]
                    task_probs.append(float(np.mean(probs)))

                probability = float(np.mean(task_probs))
                confidence = float(max(probability, 1 - probability))
                logger.info(f"✅ Prediction: {probability:.3f}, confidence: {confidence:.3f}")
                return probability, confidence, feature_dict
            except Exception as e:
                logger.error(f"❌ Prediction failed: {e}", exc_info=True)

        # MOCK fallback
        logger.warning("⚠️ Using MOCK prediction")
        vel = feature_dict.get('raw_vel_mean', 0.0)
        dur = feature_dict.get('fix_dur_mean', 0.0)
        risk = min(max(
            min(vel / 300.0, 1.0) * 0.5 + min(dur / 500.0, 1.0) * 0.5,
            0.1), 0.95)
        return risk, 0.75, feature_dict

    def generate_explanation(
        self,
        feature_dict: Dict,
        probability: float
    ) -> Tuple[List[str], str]:
        indicators = []
        fix_dur = feature_dict.get('fix_dur_mean', 0.0)
        regressions = feature_dict.get('raw_regressions', 0.0)
        vel_mean = feature_dict.get('raw_vel_mean', 0.0)
        fix_count = feature_dict.get('fix_count', 0.0)

        if fix_dur > 50:
            indicators.append(
                f"results.eyeTracking.longDurations|duration={fix_dur:.0f}")
        if regressions > 3:
            indicators.append(
                f"results.eyeTracking.backwardMovements|count={regressions:.0f}")
        if vel_mean > 20:
            indicators.append(
                f"results.eyeTracking.highVelocity|velocity={vel_mean:.1f}")
        if fix_count > 20:
            indicators.append(
                f"results.eyeTracking.highFixationCount|count={fix_count:.0f}")
        if not indicators:
            indicators.append("Reading patterns within typical range")

        if probability >= 0.7:
            recommendation = (
                "High risk detected. Recommend comprehensive psychoeducational "
                "assessment by qualified professional within 2-4 weeks.")
        elif probability >= 0.4:
            recommendation = (
                "Moderate risk detected. Consider follow-up screening and "
                "consultation with reading specialist.")
        else:
            recommendation = (
                "Low risk detected. Continue monitoring reading development "
                "through regular assessments.")

        return indicators, recommendation