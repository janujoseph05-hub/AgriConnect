"""Client for the official Government of India OGD market-data API."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BACKEND_DIR / ".env")

OGD_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
REQUEST_TIMEOUT_SECONDS = 20


class OGDAPIError(Exception):
    """A safe, user-facing error from configuration or the OGD API."""

    def __init__(self, message: str, http_status: int = 502):
        super().__init__(message)
        self.message = message
        self.http_status = http_status


def _get_api_key() -> str:
    api_key = os.getenv("OGD_API_KEY", "").strip()
    if not api_key or api_key == "PASTE_YOUR_API_KEY_HERE":
        raise OGDAPIError(
            "OGD_API_KEY is not configured. Add the valid key to backend/.env.",
            http_status=503,
        )
    return api_key


def get_market_data(limit: int = 10, offset: int = 0) -> list[dict[str, Any]]:
    """Fetch one page of market records from data.gov.in."""
    if not 1 <= limit <= 1000:
        raise OGDAPIError("limit must be between 1 and 1000.", http_status=400)
    if offset < 0:
        raise OGDAPIError("offset must be zero or greater.", http_status=400)

    params = {
        "api-key": _get_api_key(),
        "format": "json",
        "limit": limit,
        "offset": offset,
    }

    try:
        response = requests.get(
            OGD_API_URL,
            params=params,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except requests.Timeout as error:
        raise OGDAPIError("The official OGD API request timed out.", 504) from None
    except requests.HTTPError as error:
        status = error.response.status_code if error.response is not None else 502
        if status in (401, 403):
            message = "The official OGD API rejected the API key or authorization."
        elif status == 429:
            message = "The official OGD API quota or rate limit was exceeded."
        else:
            message = f"The official OGD API returned HTTP {status}."
        raise OGDAPIError(message, 502) from None
    except requests.RequestException as error:
        raise OGDAPIError("The official OGD API could not be reached.", 502) from None

    try:
        payload = response.json()
    except ValueError as error:
        raise OGDAPIError("The official OGD API returned invalid JSON.", 502) from None

    if not isinstance(payload, dict):
        raise OGDAPIError("The official OGD API returned an unexpected response.", 502)

    records = payload.get("records")
    if not isinstance(records, list):
        raise OGDAPIError("The official OGD API response did not contain records.", 502)

    return [record for record in records if isinstance(record, dict)]