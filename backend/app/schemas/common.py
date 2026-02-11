from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class BaseResponse(BaseModel):
    """Base response that all API responses inherit from."""
    success: bool = True
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response format."""
    error: str
    message: str
    details: Optional[Any] = None


class HealthResponse(BaseModel):
    """Response for health check endpoint."""
    status: str
    version: str
    services: dict


class StatsResponse(BaseModel):
    """Response for statistics endpoint."""
    total_contracts: int
    total_analyses: int
    total_vulnerabilities: int
    vulnerabilities_by_severity: dict
    vulnerabilities_by_type: dict
    average_scan_time_ms: int
    scans_today: int
    scans_this_week: int


class PaginationParams(BaseModel):
    """Common pagination parameters."""
    skip: int = 0
    limit: int = 20


class TimestampMixin(BaseModel):
    """Mixin that adds timestamp fields."""
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows creating from SQLAlchemy models