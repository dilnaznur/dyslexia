#!/usr/bin/env python3
"""
Model Validation Script for MindStep Backend
Validates that model files are correctly formatted and loadable.
"""
import sys
from pathlib import Path
import numpy as np

def validate_models():
    """Validate model and scaler files."""
    print("=" * 60)
    print("MindStep Model Validation")
    print("=" * 60)

    models_dir = Path(__file__).parent / "models"
    model_path = models_dir / "optimal_tvi_model.pkl"
    scaler_path = models_dir / "scaler.pkl"

    errors = []
    warnings = []

    # Check file existence
    print("\n1. Checking file existence...")
    if not model_path.exists():
        errors.append(f"❌ Model file not found: {model_path}")
        print(f"   ❌ Model file not found: {model_path}")
    else:
        print(f"   ✅ Model file found: {model_path}")
        print(f"      Size: {model_path.stat().st_size / 1024:.1f} KB")

    if not scaler_path.exists():
        errors.append(f"❌ Scaler file not found: {scaler_path}")
        print(f"   ❌ Scaler file not found: {scaler_path}")
    else:
        print(f"   ✅ Scaler file found: {scaler_path}")
        print(f"      Size: {scaler_path.stat().st_size / 1024:.1f} KB")

    if errors:
        print("\n" + "=" * 60)
        print("VALIDATION FAILED")
        print("=" * 60)
        for error in errors:
            print(error)
        print("\nPlace your trained model files in backend/models/")
        print("See backend/models/README.md for instructions")
        return False

    # Try loading model
    print("\n2. Loading model...")
    try:
        import joblib
        model = joblib.load(model_path)
        print("   ✅ Model loaded successfully")

        # Check model type
        model_type = type(model).__name__
        print(f"   Model type: {model_type}")

        if "RandomForest" not in model_type:
            warnings.append(f"⚠️ Expected RandomForestClassifier, got {model_type}")

        # Check for required methods
        if not hasattr(model, 'predict_proba'):
            errors.append("❌ Model missing predict_proba method")
        else:
            print("   ✅ Model has predict_proba method")

        if not hasattr(model, 'predict'):
            errors.append("❌ Model missing predict method")
        else:
            print("   ✅ Model has predict method")

        # Check model parameters (if RandomForest)
        if hasattr(model, 'n_estimators'):
            print(f"   n_estimators: {model.n_estimators}")
            if model.n_estimators != 200:
                warnings.append(f"⚠️ Expected 200 estimators, got {model.n_estimators}")

        if hasattr(model, 'max_depth'):
            print(f"   max_depth: {model.max_depth}")
            if model.max_depth != 15:
                warnings.append(f"⚠️ Expected max_depth=15, got {model.max_depth}")

    except Exception as e:
        errors.append(f"❌ Failed to load model: {e}")
        print(f"   ❌ Failed to load model: {e}")
        return False

    # Try loading scaler
    print("\n3. Loading scaler...")
    try:
        import joblib
        scaler = joblib.load(scaler_path)
        print("   ✅ Scaler loaded successfully")

        # Check scaler type
        scaler_type = type(scaler).__name__
        print(f"   Scaler type: {scaler_type}")

        if "StandardScaler" not in scaler_type:
            warnings.append(f"⚠️ Expected StandardScaler, got {scaler_type}")

        # Check for required methods
        if not hasattr(scaler, 'transform'):
            errors.append("❌ Scaler missing transform method")
        else:
            print("   ✅ Scaler has transform method")

        # Check feature count
        if hasattr(scaler, 'n_features_in_'):
            n_features = scaler.n_features_in_
            print(f"   Features expected: {n_features}")
            if n_features != 12:
                errors.append(f"❌ Expected 12 features, scaler expects {n_features}")

    except Exception as e:
        errors.append(f"❌ Failed to load scaler: {e}")
        print(f"   ❌ Failed to load scaler: {e}")
        return False

    # Test prediction pipeline
    print("\n4. Testing prediction pipeline...")
    try:
        # Create dummy 12-feature input
        dummy_features = np.random.rand(1, 12)
        print(f"   Test input shape: {dummy_features.shape}")

        # Scale features
        scaled_features = scaler.transform(dummy_features)
        print(f"   ✅ Scaler transform successful")

        # Make prediction
        prediction_proba = model.predict_proba(scaled_features)
        print(f"   ✅ Model prediction successful")
        print(f"   Output shape: {prediction_proba.shape}")
        print(f"   Probabilities: {prediction_proba[0]}")

        # Validate output
        if prediction_proba.shape != (1, 2):
            errors.append(f"❌ Expected output shape (1, 2), got {prediction_proba.shape}")
        else:
            print("   ✅ Output shape correct (1, 2)")

        # Check probabilities sum to 1
        prob_sum = np.sum(prediction_proba[0])
        if not np.isclose(prob_sum, 1.0, atol=1e-5):
            warnings.append(f"⚠️ Probabilities don't sum to 1.0: {prob_sum}")
        else:
            print(f"   ✅ Probabilities sum to 1.0")

    except Exception as e:
        errors.append(f"❌ Prediction pipeline test failed: {e}")
        print(f"   ❌ Prediction pipeline test failed: {e}")
        return False

    # Print warnings
    if warnings:
        print("\n⚠️ WARNINGS:")
        for warning in warnings:
            print(f"   {warning}")

    # Final result
    print("\n" + "=" * 60)
    if errors:
        print("VALIDATION FAILED")
        print("=" * 60)
        for error in errors:
            print(error)
        return False
    else:
        print("✅ VALIDATION SUCCESSFUL")
        print("=" * 60)
        print("Model and scaler are correctly formatted and loadable.")
        print("Start your server with: uvicorn main:app --reload")
        return True

if __name__ == "__main__":
    success = validate_models()
    sys.exit(0 if success else 1)
