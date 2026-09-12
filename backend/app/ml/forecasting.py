"""Persisted modal-price forecasting service."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from .data_loader import load_data, validate_required_columns
from .preprocessing import engineer_price_features, prepare_market_data

BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATASET = BACKEND_DIR / "data" / "ogd_historical.csv"
MODEL_DIR = BACKEND_DIR / "models"
MODEL_PATH = MODEL_DIR / "modal_price_model.joblib"
METADATA_PATH = MODEL_DIR / "modal_price_metadata.json"
MIN_DATES = 3
MIN_ROWS = 20

class InsufficientHistoricalData(ValueError):
    pass


def _check_history(dataframe: pd.DataFrame) -> None:
    prepared = prepare_market_data(dataframe)
    features = engineer_price_features(prepared, lags=(1,))
    if prepared["arrival_date"].nunique() < MIN_DATES or len(features) < MIN_ROWS:
        raise InsufficientHistoricalData(f"Insufficient historical data for reliable forecasting. Need at least {MIN_DATES} dates and {MIN_ROWS} usable rows; found {prepared['arrival_date'].nunique()} dates and {len(features)} usable rows.")


def train_model(dataset_path: str | Path = DEFAULT_DATASET) -> dict[str, Any]:
    raw = load_data(dataset_path)
    validate_required_columns(raw)
    _check_history(raw)
    dataframe = engineer_price_features(raw, lags=(1,))
    categorical = ["commodity", "market", "variety", "grade", "state", "district"]
    numeric = ["modal_price_lag_1", "year", "month", "week", "day_of_year", "day_of_week"]
    features = categorical + numeric
    transformer = ColumnTransformer([("categorical", OneHotEncoder(handle_unknown="ignore"), categorical), ("numeric", "passthrough", numeric)])
    model = Pipeline([("features", transformer), ("regressor", RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1))])
    split = int(len(dataframe) * 0.8)
    if split <= 0 or split >= len(dataframe):
        raise InsufficientHistoricalData("Insufficient rows for a chronological train/test split.")
    train, test = dataframe.iloc[:split], dataframe.iloc[split:]
    model.fit(train[features], train["modal_price"])
    predictions = model.predict(test[features])
    metrics = {"mae": round(float(mean_absolute_error(test["modal_price"], predictions)), 2), "rmse": round(float(mean_squared_error(test["modal_price"], predictions) ** 0.5), 2), "r2": round(float(r2_score(test["modal_price"], predictions)), 3) if len(test) > 1 else None}
    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    metadata = {"model": "RandomForestRegressor", "trained": True, "training_rows": len(train), "test_rows": len(test), "features": features, "metrics": metrics, "supported_commodities": sorted(dataframe.commodity.unique().tolist()), "supported_markets": sorted(dataframe.market.unique().tolist()), "date_range": {"earliest": str(dataframe.arrival_date.min().date()), "latest": str(dataframe.arrival_date.max().date())}}
    METADATA_PATH.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    return metadata


def model_info() -> dict[str, Any]:
    if not METADATA_PATH.exists():
        return {"model": None, "trained": False, "status": "insufficient_historical_data", "message": "Insufficient historical data for reliable forecasting."}
    return json.loads(METADATA_PATH.read_text(encoding="utf-8"))


def forecast_options() -> dict[str, list[str]]:
    if not DEFAULT_DATASET.exists():
        return {"commodities": [], "markets": []}
    dataframe = load_data(DEFAULT_DATASET)
    return {"commodities": sorted(dataframe["commodity"].dropna().unique().tolist()), "markets": sorted(dataframe["market"].dropna().unique().tolist())}


def predict_price(commodity: str, market: str, days_ahead: int) -> dict[str, Any]:
    info = model_info()
    if not info.get("trained") or not MODEL_PATH.exists():
        raise InsufficientHistoricalData("Insufficient historical data for reliable forecasting.")
    if not 1 <= days_ahead <= 90:
        raise ValueError("days_ahead must be between 1 and 90.")
    if commodity not in info["supported_commodities"] or market not in info["supported_markets"]:
        raise ValueError("Commodity or market is not supported by the trained dataset.")
    raise NotImplementedError("Prediction context is unavailable; retrain with a current historical dataset.")
