# Market Price Forecasting

Place genuine historical data in `backend/data/ogd_historical.csv` (or adapt the training path). Required fields are `State`, `District`, `Market`, `Commodity`, `Variety`, `Grade`, `Arrival Date`, `Min X0020 Price`, `Max X0020 Price`, and `Modal X0020 Price`.

The pipeline normalizes fields, validates the schema, converts dates/prices, removes exact duplicates, creates chronological time features and genuine lag features, and evaluates a `RandomForestRegressor` on a chronological 80/20 split. Training refuses the current 10-row, one-date sample.

This stage forecasts modal market price only. The verified OGD data does not directly provide demand. True demand forecasting requires quantities sold/traded, buyer orders, consumption, inventory, arrival quantities, or another validated demand proxy. No demand or supply values are manufactured.
