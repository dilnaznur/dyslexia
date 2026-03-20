import pickle
from pathlib import Path


def validate_etdd70_model(model_path: str) -> bool:
    try:
        with open(model_path, 'rb') as f:
            data = pickle.load(f)
        assert "task_fitted_models" in data
        assert "scaler" in data
        assert "feature_cols" in data
        assert "TASKS" in data
        for task in data["TASKS"]:
            for model in data["task_fitted_models"][task]:
                assert hasattr(model, 'predict_proba')
        print(f"✅ Model valid: {len(data['feature_cols'])} features, "
              f"accuracy={data.get('accuracy', '?'):.4f}")
        return True
    except Exception as e:
        print(f"❌ Validation failed: {e}")
        return False


if __name__ == "__main__":
    path = Path(__file__).parent / "models" / "etdd70_model.pkl"
    validate_etdd70_model(str(path))
