"""Train the modal-price model from a genuine historical dataset."""
from .forecasting import DEFAULT_DATASET, InsufficientHistoricalData, train_model

if __name__ == "__main__":
    try:
        print(train_model(DEFAULT_DATASET))
    except InsufficientHistoricalData as error:
        print(f"TRAINING_REFUSED: {error}")
        raise SystemExit(2) from error
