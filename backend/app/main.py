from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

from .database import (
    create_listing,
    delete_listing,
    get_all_listings,
    get_listing_by_id,
    initialize_database,
    create_user,
    add_fpo_farmer,
    create_fpo_produce,
    delete_fpo_produce,
    get_farmer_by_email,
    get_fpo_produce,
    get_fpo_stats,
    get_market_listing,
    get_purchase_request,
    list_buyer_purchase_requests,
    list_received_purchase_requests,
    create_purchase_request,
    change_purchase_status,
    get_delivery,
    list_deliveries_for_user,
    update_delivery_status,
    get_user_by_id_with_role,
    get_user_auth_record,
    is_fpo_farmer_associated,
    list_fpo_farmers,
    list_fpo_produce,
    remove_fpo_farmer,
    update_fpo_produce,
    update_listing,
)
from .auth import hash_password, verify_password
from .services.ogd_api import OGDAPIError, get_market_data
from .models import (
    AuthResponse,
    DeleteResponse,
    ListingCreate,
    ListingResponse,
    UserLogin,
    UserRegistration,
    UserResponse,
    FpoFarmerAdd,
    FpoFarmerResponse,
    FpoProduceCreate,
    FpoProduceResponse,
    FpoStatsResponse,
    PurchaseRequestCreate,
    PurchaseRequestResponse,
    PurchaseStatusUpdate,
    DeliveryResponse,
    DeliveryStatusUpdate,
)
from .ml.forecasting import InsufficientHistoricalData, forecast_options, model_info, predict_price

app = FastAPI()

initialize_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "X-User-Id"],
)


@app.get("/")
def root():
    return {"message": "AgriConnect API is running"}


@app.get("/api/market-data/test")
def test_market_data_connection():
    """Fetch a small live sample from the official OGD market-data API."""
    try:
        records = get_market_data(limit=10, offset=0)
    except OGDAPIError as error:
        raise HTTPException(status_code=error.http_status, detail=error.message) from error

    return {"success": True, "count": len(records), "records": records}


class ForecastRequest(BaseModel):
    commodity: str = Field(min_length=1)
    market: str = Field(min_length=1)
    days_ahead: int = Field(ge=1, le=90)


@app.get("/api/forecast/model-info")
def get_forecast_model_info():
    return model_info()


@app.get("/api/forecast/commodities")
def get_forecast_commodities():
    return {"commodities": forecast_options()["commodities"]}


@app.get("/api/forecast/markets")
def get_forecast_markets():
    return {"markets": forecast_options()["markets"]}


@app.post("/api/forecast/predict")
def get_price_forecast(payload: ForecastRequest):
    try:
        return predict_price(payload.commodity, payload.market, payload.days_ahead)
    except InsufficientHistoricalData as error:
        raise HTTPException(status_code=409, detail=str(error)) from None
    except NotImplementedError as error:
        raise HTTPException(status_code=409, detail=str(error)) from None
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


@app.post("/api/auth/register", response_model=UserResponse, status_code=201)
def register_user(registration: UserRegistration):
    email = str(registration.email).lower()
    if get_user_auth_record(email) is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    try:
        user = create_user(
            name=registration.name,
            email=email,
            password_hash=hash_password(registration.password),
            role=registration.role,
            location=registration.location,
        )
    except Exception as error:
        if "UNIQUE constraint failed" in str(error):
            raise HTTPException(status_code=409, detail="An account with this email already exists.") from None
        raise
    return user


@app.post("/api/auth/login", response_model=AuthResponse)
def login_user(credentials: UserLogin):
    email = str(credentials.email).lower()
    user = get_user_auth_record(email)
    if user is None or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    safe_user = {key: value for key, value in user.items() if key != "password_hash"}
    return {"success": True, "user": safe_user, "message": "Login successful."}


def require_fpo_user(user_id: int | None):
    """Prototype identity check using the authenticated user's safe ID."""
    if user_id is None:
        raise HTTPException(status_code=401, detail="FPO authentication is required.")
    user = get_user_by_id_with_role(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Authenticated user was not found.")
    if user["role"] != "fpo":
        raise HTTPException(status_code=403, detail="Only FPO users can access this resource.")
    return user


def require_user_role(user_id: int | None, role: str):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    user = get_user_by_id_with_role(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Authenticated user was not found.")
    if user["role"] != role:
        raise HTTPException(status_code=403, detail=f"Only {role} users can access this resource.")
    return user


@app.get("/api/fpo/farmers", response_model=list[FpoFarmerResponse])
def get_fpo_farmers(x_user_id: int | None = Header(default=None)):
    user = require_fpo_user(x_user_id)
    return list_fpo_farmers(user["id"])


@app.post("/api/fpo/farmers", response_model=FpoFarmerResponse, status_code=201)
def add_farmer_to_fpo(payload: FpoFarmerAdd, x_user_id: int | None = Header(default=None)):
    fpo = require_fpo_user(x_user_id)
    farmer = get_farmer_by_email(str(payload.email))
    if farmer is None:
        raise HTTPException(status_code=404, detail="No registered user was found with that email.")
    if farmer["role"] != "farmer":
        raise HTTPException(status_code=400, detail="Only users with the farmer role can be associated.")
    if is_fpo_farmer_associated(fpo["id"], farmer["id"]):
        raise HTTPException(status_code=400, detail="This farmer is already associated with the FPO.")
    try:
        add_fpo_farmer(fpo["id"], farmer["id"])
    except Exception as error:
        if "UNIQUE constraint failed" in str(error):
            raise HTTPException(status_code=400, detail="This farmer is already associated with the FPO.") from None
        raise
    return next(item for item in list_fpo_farmers(fpo["id"]) if item["id"] == farmer["id"])


@app.delete("/api/fpo/farmers/{farmer_id}", status_code=204)
def remove_farmer_from_fpo(farmer_id: int, x_user_id: int | None = Header(default=None)):
    fpo = require_fpo_user(x_user_id)
    if not remove_fpo_farmer(fpo["id"], farmer_id):
        raise HTTPException(status_code=404, detail="Farmer association not found.")


@app.get("/api/fpo/produce", response_model=list[FpoProduceResponse])
def get_fpo_produce_items(x_user_id: int | None = Header(default=None)):
    fpo = require_fpo_user(x_user_id)
    return list_fpo_produce(fpo["id"])


@app.post("/api/fpo/produce", response_model=FpoProduceResponse, status_code=201)
def create_fpo_produce_item(payload: FpoProduceCreate, x_user_id: int | None = Header(default=None)):
    fpo = require_fpo_user(x_user_id)
    return create_fpo_produce(fpo["id"], **payload.model_dump())


@app.put("/api/fpo/produce/{produce_id}", response_model=FpoProduceResponse)
def update_fpo_produce_item(produce_id: int, payload: FpoProduceCreate, x_user_id: int | None = Header(default=None)):
    fpo = require_fpo_user(x_user_id)
    updated = update_fpo_produce(fpo["id"], produce_id, **payload.model_dump())
    if updated is None:
        raise HTTPException(status_code=404, detail="FPO produce listing not found.")
    return updated


@app.delete("/api/fpo/produce/{produce_id}", status_code=204)
def delete_fpo_produce_item(produce_id: int, x_user_id: int | None = Header(default=None)):
    fpo = require_fpo_user(x_user_id)
    if not delete_fpo_produce(fpo["id"], produce_id):
        raise HTTPException(status_code=404, detail="FPO produce listing not found.")


@app.get("/api/fpo/stats", response_model=FpoStatsResponse)
def get_fpo_statistics(x_user_id: int | None = Header(default=None)):
    fpo = require_fpo_user(x_user_id)
    return get_fpo_stats(fpo["id"])


@app.post("/api/purchase-requests", response_model=PurchaseRequestResponse, status_code=201)
def create_purchase_request_endpoint(payload: PurchaseRequestCreate, x_user_id: int | None = Header(default=None)):
    buyer = require_user_role(x_user_id, "buyer")
    listing = get_market_listing(payload.listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="The selected listing was not found.")
    if payload.requested_quantity > listing["quantity"]:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds the available quantity.")
    return create_purchase_request(
        buyer["id"], listing, payload.requested_quantity, payload.offered_price, payload.message
    )


@app.get("/api/purchase-requests/buyer", response_model=list[PurchaseRequestResponse])
def get_buyer_purchase_requests(x_user_id: int | None = Header(default=None)):
    buyer = require_user_role(x_user_id, "buyer")
    return list_buyer_purchase_requests(buyer["id"])


@app.get("/api/purchase-requests/received", response_model=list[PurchaseRequestResponse])
def get_received_purchase_requests(x_user_id: int | None = Header(default=None)):
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    user = get_user_by_id_with_role(x_user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Authenticated user was not found.")
    if user["role"] not in ("farmer", "fpo"):
        raise HTTPException(status_code=403, detail="Only farmers and FPOs can receive purchase requests.")
    return list_received_purchase_requests(user["id"], user["role"])


def can_access_purchase_request(request, user):
    return (
        request["buyer_id"] == user["id"]
        or (user["role"] == "farmer" and request["farmer_id"] == user["id"])
        or (user["role"] == "fpo" and request["fpo_id"] == user["id"])
    )


@app.get("/api/purchase-requests/{request_id}", response_model=PurchaseRequestResponse)
def get_purchase_request_endpoint(request_id: int, x_user_id: int | None = Header(default=None)):
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    user = get_user_by_id_with_role(x_user_id)
    request = get_purchase_request(request_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Authenticated user was not found.")
    if request is None or not can_access_purchase_request(request, user):
        raise HTTPException(status_code=404, detail="Purchase request not found.")
    return request


@app.put("/api/purchase-requests/{request_id}/status", response_model=PurchaseRequestResponse)
def update_purchase_request_status(request_id: int, payload: PurchaseStatusUpdate, x_user_id: int | None = Header(default=None)):
    if x_user_id is None:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    user = get_user_by_id_with_role(x_user_id)
    request = get_purchase_request(request_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Authenticated user was not found.")
    if request is None or not can_access_purchase_request(request, user):
        raise HTTPException(status_code=404, detail="Purchase request not found.")

    new_status = payload.status
    seller = (user["role"] == "farmer" and request["farmer_id"] == user["id"]) or (user["role"] == "fpo" and request["fpo_id"] == user["id"])
    allowed = (
        (seller and request["status"] == "pending" and new_status in ("accepted", "rejected"))
        or (seller and request["status"] == "accepted" and new_status == "completed")
        or (user["role"] == "buyer" and request["buyer_id"] == user["id"] and request["status"] == "pending" and new_status == "cancelled")
    )
    if not allowed:
        raise HTTPException(status_code=400, detail="This status transition is not allowed.")
    try:
        return change_purchase_status(request_id, new_status)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from None


def require_delivery_user(user_id: int | None):
    if user_id is None:
        raise HTTPException(status_code=401, detail="Authentication is required.")
    user = get_user_by_id_with_role(user_id)
    if user is None:
        raise HTTPException(status_code=401, detail="Authenticated user was not found.")
    if user["role"] not in ("buyer", "farmer", "fpo"):
        raise HTTPException(status_code=403, detail="This role cannot access deliveries.")
    return user


@app.get("/api/deliveries", response_model=list[DeliveryResponse])
def get_deliveries(x_user_id: int | None = Header(default=None)):
    user = require_delivery_user(x_user_id)
    return list_deliveries_for_user(user["id"], user["role"])


@app.get("/api/deliveries/{delivery_id}", response_model=DeliveryResponse)
def get_delivery_details(delivery_id: int, x_user_id: int | None = Header(default=None)):
    user = require_delivery_user(x_user_id)
    delivery = get_delivery(delivery_id)
    if delivery is None or not (
        delivery["buyer_id"] == user["id"]
        or (user["role"] in ("farmer", "fpo") and delivery["seller_id"] == user["id"] and delivery["seller_type"] == user["role"])
    ):
        raise HTTPException(status_code=404, detail="Delivery not found.")
    return delivery


@app.put("/api/deliveries/{delivery_id}/status", response_model=DeliveryResponse)
def change_delivery_status(delivery_id: int, payload: DeliveryStatusUpdate, x_user_id: int | None = Header(default=None)):
    user = require_delivery_user(x_user_id)
    delivery = get_delivery(delivery_id)
    if delivery is None:
        raise HTTPException(status_code=404, detail="Delivery not found.")
    is_seller = user["role"] in ("farmer", "fpo") and delivery["seller_id"] == user["id"] and delivery["seller_type"] == user["role"]
    if not is_seller:
        raise HTTPException(status_code=403, detail="Only the associated seller can update delivery status.")
    allowed_transitions = {
        "pending": {"pickup_scheduled", "cancelled"},
        "pickup_scheduled": {"in_transit", "cancelled"},
        "in_transit": {"delivered"},
        "delivered": set(),
        "cancelled": set(),
    }
    if payload.status not in allowed_transitions[delivery["status"]]:
        raise HTTPException(status_code=400, detail="This delivery status transition is not allowed.")
    return update_delivery_status(delivery_id, payload.status)


@app.get("/api/listings", response_model=list[ListingResponse])
def list_listings():
    return get_all_listings()


@app.get("/api/listings/{listing_id}", response_model=ListingResponse)
def get_listing(listing_id: int):
    listing = get_listing_by_id(listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return listing


@app.post("/api/listings", response_model=ListingResponse, status_code=201)
def create_new_listing(listing: ListingCreate, x_user_id: int | None = Header(default=None)):
    farmer_id = None
    if x_user_id is not None:
        user = get_user_by_id_with_role(x_user_id)
        if user and user["role"] == "farmer":
            farmer_id = user["id"]
    return create_listing(**listing.model_dump(), farmer_id=farmer_id)


@app.put("/api/listings/{listing_id}", response_model=ListingResponse)
def update_existing_listing(listing_id: int, listing: ListingCreate):
    updated_listing = update_listing(listing_id, **listing.model_dump())
    if updated_listing is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    return updated_listing


@app.delete("/api/listings/{listing_id}", response_model=DeleteResponse)
def delete_existing_listing(listing_id: int):
    deleted = delete_listing(listing_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"message": "Listing deleted successfully", "listing_id": listing_id}
