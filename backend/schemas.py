from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ContractAnalysisRequest(BaseModel):
    contract_name: str = "Unnamed Contract"
    contract_code: str
    network: str = "ethereum"


class FetchContractRequest(BaseModel):
    address: str
    network: str = "ethereum"


class FetchContractResponse(BaseModel):
    address: str
    network: str
    contract_name: str
    source_code: str
    compiler_version: Optional[str] = ""
    is_verified: bool


class VulnerabilityResponse(BaseModel):
    id: str
    title: str
    severity: str
    category: str
    description: str
    impact: Optional[str] = ""
    recommendation: Optional[str] = ""
    vulnerable_code: Optional[str] = ""
    fixed_code: Optional[str] = ""
    line_start: Optional[int] = None
    line_end: Optional[int] = None
    function_name: Optional[str] = ""
    confidence: Optional[str] = "medium"


class AnalysisResponse(BaseModel):
    id: str
    contract_name: str
    network: str
    risk_score: int
    overall_risk: str
    summary: str
    vulnerabilities: list[VulnerabilityResponse]
    scan_duration_ms: int
    total_lines: int
    created_at: str


class HealthResponse(BaseModel):
    status: str
    version: str
    services: dict


class StatsResponse(BaseModel):
    total_contracts: int
    total_analyses: int
    total_vulnerabilities: int
    scans_today: int
    scans_this_week: int
    average_scan_time_ms: int


class HistoryItem(BaseModel):
    id: str
    contract_name: str
    network: str
    risk_score: int
    vulnerability_count: int
    created_at: str


class ReportResponse(BaseModel):
    id: str
    contract_name: str
    network: str
    source_code: str
    risk_score: int
    overall_risk: str
    summary: str
    vulnerabilities: list[VulnerabilityResponse]
    scan_duration_ms: int
    total_lines: int
    created_at: str


class ChatRequest(BaseModel):
    message: str
    analysis_id: Optional[int] = None
    session_id: Optional[int] = None


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    content: str
    created_at: str


class ChatHistoryResponse(BaseModel):
    session_id: int
    analysis_id: Optional[int] = None
    messages: list[ChatMessageResponse]
    created_at: str