from pathlib import Path
import json
from typing import Any

import pandas as pd

from .preprocessing import normalize_column_names

REQUIRED_COLUMNS = {"state", "district", "market", "commodity", "variety", "grade", "arrival_date", "min_price", "max_price", "modal_price"}


def load_csv_dataset(file_path: str | Path) -> pd.DataFrame:
    """Load a CSV file into a DataFrame.

    The loader does not assume any dataset-specific column names. A clear
    exception is raised for a missing path or an invalid CSV so callers can
    decide how to present the problem.
    """
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"Dataset file was not found: {path}")

    try:
        return pd.read_csv(path)
    except (pd.errors.ParserError, UnicodeDecodeError, OSError) as error:
        raise ValueError(f"Unable to load CSV dataset '{path}': {error}") from error


def load_data(file_path: str | Path) -> pd.DataFrame:
    """Load CSV or an OGD JSON records payload and normalize its columns."""
    path = Path(file_path)
    if not path.is_file():
        raise FileNotFoundError(f"Dataset file was not found: {path}")
    if path.suffix.lower() == ".json":
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            records = payload.get("records", payload) if isinstance(payload, dict) else payload
            dataframe = pd.json_normalize(records)
        except (json.JSONDecodeError, TypeError, OSError) as error:
            raise ValueError(f"Unable to load JSON dataset '{path}': {error}") from error
    else:
        dataframe = load_csv_dataset(path)
    return normalize_column_names(dataframe)


def validate_required_columns(dataframe: pd.DataFrame) -> None:
    missing = sorted(REQUIRED_COLUMNS - set(dataframe.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {', '.join(missing)}")


def generate_data_report(dataframe: pd.DataFrame) -> dict[str, Any]:
    return {"rows": int(len(dataframe)), "columns": list(dataframe.columns), "missing_values": {str(k): int(v) for k, v in dataframe.isna().sum().items()}, "duplicate_rows": int(dataframe.duplicated().sum())}


def get_dataset_info(dataframe: pd.DataFrame) -> dict[str, Any]:
    """Return basic, schema-agnostic information about a DataFrame."""
    return {
        "row_count": len(dataframe.index),
        "column_count": len(dataframe.columns),
        "column_names": list(dataframe.columns),
    }
