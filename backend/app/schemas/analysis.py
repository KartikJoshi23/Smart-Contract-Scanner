from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.schemas.vulnerability import (
    VulnerabilitySummary,
    VulnerabilityDetail,
    SeverityEnum
)


class AnalysisStatusEnum(str, Enum):
    """Current state of an analysis."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# ============ RESPONSE SCHEMAS ============

class AnalysisBase(BaseModel):
    """Base analysis fields."""
    id: str
    contract_id: str
    status: AnalysisStatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


class AnalysisSummary(AnalysisBase):
    """
    Brief analysis info for list views.
    
    Used when showing analysis history.
    """
    overall_risk: Optional[SeverityEnum] = None
    risk_score: Optional[int] = None
    vulnerability_count: int = 0
    scan_duration_ms: Optional[int] = None
    completed_at: Optional[datetime] = None


class AnalysisProgress(BaseModel):
    """
    Progress update during analysis.
    
    Used for real-time status updates.
    """
    analysis_id: str
    status: AnalysisStatusEnum
    progress: int = Field(ge=0, le=100)  # 0-100 percentage
    current_step: str
    steps_completed: List[str]
    estimated_time_remaining_ms: Optional[int] = None


class AnalysisResult(AnalysisBase):
    """
    Complete analysis result.
    
    This is the main response after scanning a contract.
    """
    # Contract info
    contract_name: str
    
    # Results
    overall_risk: Optional[SeverityEnum] = None
    risk_score: Optional[int] = Field(None, ge=0, le=100)
    summary: Optional[str] = None
    
    # Performance
    scan_duration_ms: Optional[int] = None
    completed_at: Optional[datetime] = None
    
    # Statistics
    total_lines: Optional[int] = None
    vulnerable_lines: Optional[int] = None
    functions_analyzed: Optional[int] = None
    
    # AI models used
    detection_model: str = "deepseek-coder-v2"
    explanation_model: str = "llama3.1:8b"
    
    # Vulnerabilities found
    vulnerabilities: List[VulnerabilityDetail] = []
    
    # Error info (if failed)
    error_message: Optional[str] = None


class AnalysisListResponse(BaseModel):
    """Response for listing multiple analyses."""
    total: int
    skip: int
    limit: int
    analyses: List[AnalysisSummary]


# ============ STATISTICS SCHEMAS ============

class SeverityCount(BaseModel):
    """Count of vulnerabilities by severity."""
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0


class AnalysisStats(BaseModel):
    """Overall analysis statistics."""
    total_analyses: int
    completed_analyses: int
    failed_analyses: int
    average_scan_time_ms: int
    vulnerabilities_found: int
    severity_breakdown: SeverityCount