from typing import Literal

from pydantic import BaseModel, EmailStr, Field, constr


NonEmptyText = constr(strip_whitespace=True, min_length=1)


class ListingBase(BaseModel):
    crop_name: NonEmptyText
    quantity: float = Field(gt=0)
    unit: NonEmptyText
    location: NonEmptyText
    farmer_name: NonEmptyText
    expected_price: float | None = Field(default=None, ge=0)
    available_from: str | None = None
    description: str | None = None


class ListingCreate(ListingBase):
    pass


class ListingResponse(ListingBase):
    id: int
    source_type: Literal["farmer", "fpo"] = "farmer"
    source_name: str | None = None


class DeleteResponse(BaseModel):
    message: str
    listing_id: int


UserRole = Literal["farmer", "fpo", "buyer"]


class UserRegistration(BaseModel):
    name: NonEmptyText
    email: EmailStr
    password: constr(min_length=8, max_length=128)
    role: UserRole
    location: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: constr(min_length=1, max_length=128)


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    created_at: str | None = None
    location: str | None = None


class AuthResponse(BaseModel):
    success: bool = True
    user: UserResponse
    message: str


class FpoFarmerAdd(BaseModel):
    email: EmailStr


class FpoFarmerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    joined_at: str | None = None
    status: str


class FpoProduceCreate(BaseModel):
    crop_name: NonEmptyText
    quantity: float = Field(gt=0)
    unit: NonEmptyText
    location: str | None = None
    expected_price: float | None = Field(default=None, ge=0)
    available_from: str | None = None
    description: str | None = None


class FpoProduceResponse(FpoProduceCreate):
    id: int
    fpo_id: int
    created_at: str | None = None


class FpoStatsResponse(BaseModel):
    total_farmers: int
    total_produce_quantity: float
    active_produce_listings: int
    number_of_crops: int


PurchaseStatus = Literal["pending", "accepted", "rejected", "cancelled", "completed"]


class PurchaseRequestCreate(BaseModel):
    listing_id: int
    requested_quantity: float = Field(gt=0)
    offered_price: float | None = Field(default=None, ge=0)
    message: str | None = None


class PurchaseStatusUpdate(BaseModel):
    status: PurchaseStatus


class PurchaseRequestResponse(BaseModel):
    id: int
    buyer_id: int
    listing_id: int
    listing_source: Literal["farmer", "fpo"]
    farmer_id: int | None = None
    fpo_id: int | None = None
    crop_name: str
    requested_quantity: float
    unit: str
    offered_price: float | None = None
    message: str | None = None
    status: PurchaseStatus
    created_at: str | None = None
    updated_at: str | None = None
    buyer_name: str | None = None
    buyer_email: str | None = None
    seller_name: str | None = None
    seller_email: str | None = None
    seller_type: Literal["Farmer", "FPO"] | None = None


DeliveryStatus = Literal["pending", "pickup_scheduled", "in_transit", "delivered", "cancelled"]


class DeliveryStatusUpdate(BaseModel):
    status: DeliveryStatus


class DeliveryResponse(BaseModel):
    id: int
    purchase_request_id: int
    buyer_id: int
    seller_type: Literal["farmer", "fpo"]
    seller_id: int
    crop_name: str
    quantity: float
    unit: str
    pickup_location: str | None = None
    destination: str | None = None
    status: DeliveryStatus
    distance: float | None = None
    eta: str | None = None
    created_at: str | None = None
    updated_at: str | None = None
    buyer_name: str | None = None
    buyer_email: str | None = None
    seller_name: str | None = None
