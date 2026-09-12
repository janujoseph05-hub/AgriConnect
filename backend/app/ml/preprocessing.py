import re
from typing import Any

import pandas as pd


def normalize_column_name(column_name: Any) -> str:
    """Convert one column name to lowercase snake_case."""
    normalized = str(column_name).strip().lower()
    normalized = re.sub(r"[^a-z0-9]+", "_", normalized)
    return normalized.strip("_")


def normalize_column_names(dataframe: pd.DataFrame) -> pd.DataFrame:
    """Return a copy with consistent, schema-agnostic column names."""
    result = dataframe.copy()
    result.columns = [normalize_column_name(column).replace("x0020", "") for column in result.columns]
    result = result.rename(columns={"mind_price": "min_price", "maxd_price": "max_price", "modald_price": "modal_price"})
    return result


def remove_exact_duplicates(dataframe: pd.DataFrame) -> pd.DataFrame:
    """Return a copy with exact duplicate rows removed."""
    return dataframe.drop_duplicates().reset_index(drop=True)


def handle_missing_values(
    dataframe: pd.DataFrame,
    fill_value: Any = None,
) -> pd.DataFrame:
    """Handle missing values without assuming agricultural column meanings.

    By default, missing values are left unchanged so no crop-specific value is
    invented. Pass an explicit ``fill_value`` when a downstream model requires
    a uniform replacement value.
    """
    result = dataframe.copy()
    if fill_value is not None:
        result = result.fillna(fill_value)
    return result


def preprocess_dataframe(dataframe: pd.DataFrame, fill_value: Any = None) -> pd.DataFrame:
    """Apply safe, schema-agnostic preprocessing steps in a stable order."""
    result = normalize_column_names(dataframe)
    result = remove_exact_duplicates(result)
    return handle_missing_values(result, fill_value=fill_value)


def report_missing_values(dataframe: pd.DataFrame) -> dict[str, dict[str, Any]]:
    """Report missing counts, data types, and non-missing counts by column."""
    report = {}
    for column in dataframe.columns:
        missing_count = int(dataframe[column].isna().sum())
        report[str(column)] = {
            "missing_count": missing_count,
            "missing_percentage": round((missing_count / len(dataframe.index)) * 100, 2)
            if len(dataframe.index)
            else 0.0,
            "data_type": str(dataframe[column].dtype),
            "non_missing_count": int(dataframe[column].notna().sum()),
        }
    return report


def convert_dates(dataframe: pd.DataFrame) -> pd.DataFrame:
    result = dataframe.copy()
    result["arrival_date"] = pd.to_datetime(result["arrival_date"], dayfirst=True, errors="coerce")
    return result


def convert_numeric_columns(dataframe: pd.DataFrame) -> pd.DataFrame:
    result = dataframe.copy()
    for column in ("min_price", "max_price", "modal_price"):
        result[column] = pd.to_numeric(result[column], errors="coerce")
    return result


def prepare_market_data(dataframe: pd.DataFrame) -> pd.DataFrame:
    result = remove_exact_duplicates(convert_dates(convert_numeric_columns(normalize_column_names(dataframe))))
    return result.dropna(subset=["arrival_date", "commodity", "market", "modal_price"]).sort_values("arrival_date").reset_index(drop=True)


def engineer_price_features(dataframe: pd.DataFrame, lags=(1,)) -> pd.DataFrame:
    result = prepare_market_data(dataframe)
    grouped = result.groupby(["commodity", "market"], sort=False)["modal_price"]
    for lag in lags:
        result[f"modal_price_lag_{lag}"] = grouped.shift(lag)
    result["year"] = result["arrival_date"].dt.year
    result["month"] = result["arrival_date"].dt.month
    result["week"] = result["arrival_date"].dt.isocalendar().week.astype(int)
    result["day_of_year"] = result["arrival_date"].dt.dayofyear
    result["day_of_week"] = result["arrival_date"].dt.dayofweek
    return result.dropna(subset=[f"modal_price_lag_{lag}" for lag in lags]).reset_index(drop=True)
