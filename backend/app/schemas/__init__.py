"""
Pydantic schemas for request/response validation.

These schemas define:
- What data we accept from users (requests)
- What data we send back (responses)
- Data validation rules
"""

from app.schemas.common import (
    BaseResponse,
    ErrorResponse,
    HealthResponse,
    StatsResponse,
    PaginationParams,
    TimestampMixin,
)

from app.schemas.contract import (
    NetworkEnum,
    ContractCodeInput,
    ContractAddressInput,
    ContractBase,
    ContractSummary,
    ContractDetail,
    ContractListResponse,
)

from app.schemas.vulnerability import (
    SeverityEnum,
    ConfidenceEnum,
    VulnerabilityTypeEnum,
    VulnerabilityBase,
    VulnerabilitySummary,
    VulnerabilityDetail,
    VulnerabilityStats,
    AIDetectedVulnerability,
    AIExplanation,
)

from app.schemas.analysis import (
    AnalysisStatusEnum,
    AnalysisBase,
    AnalysisSummary,
    AnalysisProgress,
    AnalysisResult,
    AnalysisListResponse,
    SeverityCount,
    AnalysisStats,
)


# This allows importing directly from app.schemas
# Example: from app.schemas import ContractCodeInput
__all__ = [
    # Common
    "BaseResponse",
    "ErrorResponse",
    "HealthResponse",
    "StatsResponse",
    "PaginationParams",
    "TimestampMixin",
    
    # Contract
    "NetworkEnum",
    "ContractCodeInput",
    "ContractAddressInput",
    "ContractBase",
    "ContractSummary",
    "ContractDetail",
    "ContractListResponse",
    
    # Vulnerability
    "SeverityEnum",
    "ConfidenceEnum",
    "VulnerabilityTypeEnum",
    "VulnerabilityBase",
    "VulnerabilitySummary",
    "VulnerabilityDetail",
    "VulnerabilityStats",
    "AIDetectedVulnerability",
    "AIExplanation",
    
    # Analysis
    "AnalysisStatusEnum",
    "AnalysisBase",
    "AnalysisSummary",
    "AnalysisProgress",
    "AnalysisResult",
    "AnalysisListResponse",
    "SeverityCount",
    "AnalysisStats",
]