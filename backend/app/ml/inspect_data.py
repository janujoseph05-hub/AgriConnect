"""Inspect the official OGD sample without modifying the source JSON."""

from __future__ import annotations

import json
import re
from pathlib import Path

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_PATH = PROJECT_ROOT / "data" / "ogd_sample.json"


def normalize_column_name(column_name: str) -> str:
    """Create an analysis-friendly name without changing the source data."""
    normalized = column_name.lower().replace("x0020", " ")
    normalized = re.sub(r"[^a-z0-9]+", "_", normalized)
    return normalized.strip("_")


def print_section(title: str) -> None:
    print(f"\n{'=' * 80}\n{title}\n{'=' * 80}")


def main() -> None:
    with DATA_PATH.open("r", encoding="utf-8") as file:
        source = json.load(file)

    dataframe = pd.json_normalize(source["records"])
    original_columns = list(dataframe.columns)
    dataframe.columns = [normalize_column_name(column) for column in dataframe.columns]

    dataframe["arrival_date"] = pd.to_datetime(
        dataframe["arrival_date"], dayfirst=True, errors="coerce"
    )
    price_columns = ["min_price", "max_price", "modal_price"]
    for column in price_columns:
        dataframe[column] = pd.to_numeric(dataframe[column], errors="coerce")

    dataframe["price_range"] = dataframe["max_price"] - dataframe["min_price"]

    print_section("SOURCE")
    print(f"Source URL: {source['source_url']}")
    print(f"Inspection file: {DATA_PATH}")
    print("Original JSON was read-only; normalized columns exist only in memory.")

    print_section("SHAPE AND COLUMNS")
    print(f"Number of records: {len(dataframe)}")
    print(f"Original number of columns: {len(original_columns)}")
    print(f"Number of columns after in-memory preparation: {len(dataframe.columns)}")
    print(f"Original exact column names: {original_columns}")
    print(f"Normalized in-memory column names: {list(dataframe.columns)}")

    print_section("DATA TYPES")
    print(dataframe.dtypes.to_string())

    print_section("FIRST 10 RECORDS")
    print(dataframe.head(10).to_string(index=False))

    print_section("MISSING VALUES")
    print(dataframe.isna().sum().to_string())

    print_section("DUPLICATES")
    print(f"Duplicate row count: {int(dataframe.duplicated().sum())}")

    print_section("UNIQUE VALUES")
    print(f"Unique commodities ({dataframe['commodity'].nunique()}): {sorted(dataframe['commodity'].dropna().unique())}")
    print(f"Unique markets ({dataframe['market'].nunique()}): {sorted(dataframe['market'].dropna().unique())}")
    print(f"Unique states ({dataframe['state'].nunique()}): {sorted(dataframe['state'].dropna().unique())}")

    print_section("ARRIVAL DATE")
    print(f"Minimum Arrival Date: {dataframe['arrival_date'].min().date()}")
    print(f"Maximum Arrival Date: {dataframe['arrival_date'].max().date()}")
    print(f"Unique dates in sample: {dataframe['arrival_date'].nunique()}")
    print(f"Historical dates represented in sample: {dataframe['arrival_date'].nunique() > 1}")

    print_section("PRICE DESCRIPTIVE STATISTICS")
    print(dataframe[price_columns].describe().to_string())

    print_section("PRICE RANGE")
    print(dataframe[["commodity", "market", "min_price", "max_price", "price_range"]].to_string(index=False))

    column_names = set(dataframe.columns)
    demand_columns = sorted(column for column in column_names if "demand" in column)
    arrival_quantity_columns = sorted(
        column
        for column in column_names
        if any(term in column for term in ("arrival_quantity", "arrival_qty", "arrivals", "quantity"))
    )
    supply_columns = sorted(
        column
        for column in column_names
        if any(term in column for term in ("supply", "stock", "inventory"))
    )

    print_section("FIELD VERIFICATION")
    print(f"Demand present: {bool(demand_columns)}; matching columns: {demand_columns}")
    print(
        "Arrival quantity present: "
        f"{bool(arrival_quantity_columns)}; matching columns: {arrival_quantity_columns}"
    )
    print(f"Supply quantity present: {bool(supply_columns)}; matching columns: {supply_columns}")
    print(f"Historical dates present: {dataframe['arrival_date'].nunique() > 1}")
    print(f"Price fields present: {all(column in column_names for column in price_columns)}")

    print_section("INTERPRETATION")
    print("This 10-record preview can validate schema and demonstrate current market prices.")
    print("It cannot support a forecasting model because it contains one observation date only.")
    print("The dataset does not directly provide demand. Demand must not be claimed as a directly observed field.")
    print("It also contains no arrival quantity or supply quantity field.")
    print("The available target candidates are minimum, maximum, or modal price after historical data is obtained.")


if __name__ == "__main__":
    main()
