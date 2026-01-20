# Models Directory

This directory should contain your trained ML model files:

## Required Files

1. **`optimal_tvi_model.pkl`** - Trained Random Forest classifier
   - Algorithm: RandomForestClassifier
   - Parameters: n_estimators=200, max_depth=15, random_state=42
   - Performance: 85.71% accuracy (10-fold CV)

2. **`scaler.pkl`** - Fitted StandardScaler
   - Must be the SAME scaler used during training
   - Never fit on test data - only transform

## How to Generate Model Files

### From Jupyter Notebook (Dyslex2.ipynb):

```python
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

# After training your model...
# (Assuming you have `model` and `scaler` variables)

# Save model
joblib.dump(model, 'backend/models/optimal_tvi_model.pkl')

# Save scaler
joblib.dump(scaler, 'backend/models/scaler.pkl')

print("✅ Model files saved successfully!")
```

### Alternative using pickle:

```python
import pickle

# Save model
with open('backend/models/optimal_tvi_model.pkl', 'wb') as f:
    pickle.dump(model, f)

# Save scaler
with open('backend/models/scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)

print("✅ Model files saved successfully!")
```

## Validation

To validate your model files, run:

```bash
cd backend
python validate_models.py
```

This will check:
- ✅ File existence
- ✅ Model type (RandomForestClassifier)
- ✅ Scaler type (StandardScaler)
- ✅ Feature count (expects 12 features)
- ✅ Model has required methods (predict_proba)

## Model Behavior

### With Model Files:
```
🚀 Server started with REAL ML model
   Model: Random Forest (85.71% accuracy, 94.1% @ high confidence)
```

### Without Model Files (Mock Mode):
```
⚠️ Server started in MOCK mode
   Place model files in backend/models/ for real predictions
```

## Feature Order (CRITICAL)

The model expects exactly 12 features in this order:

1. num_fixations
2. mean_fixation_duration
3. median_fixation_duration
4. total_reading_time
5. mean_fixation_x
6. std_fixation_y
7. entropy_fixation_duration
8. autocorrelation
9. cv_inter_fixation_intervals
10. meta_variability
11. tvi_score
12. weighted_tvi_score

## Notes

- **DO NOT** commit model files to Git (too large, may contain sensitive training data)
- Model files are added to `.gitignore`
- For production deployment, upload files separately to server
- Model files should be ~1-10MB depending on forest size
