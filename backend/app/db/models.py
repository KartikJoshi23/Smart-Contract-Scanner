import uuid
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import (
    Column, String, Text, Integer, Boolean,
    DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.sqlite import JSON
from app.db.database import Base


def generate_uuid():
    """Generate a unique ID for each record."""
    return str(uuid.uuid4())


# ============ ENUMS ============
# These define the allowed values for certain fields

class Network(str, PyEnum):
    """Supported blockchain networks."""
    POLYGON = "polygon"
    ETHEREUM = "ethereum"
    ARBITRUM = "arbitrum"
    OPTIMISM = "optimism"
    BASE = "base"


class SeverityLevel(str, PyEnum):
    """How dangerous is the vulnerability."""
    CRITICAL = "critical"  # Immediate fund loss possible
    HIGH = "high"          # Serious risk
    MEDIUM = "medium"      # Moderate risk
    LOW = "low"            # Minor issue
    INFO = "info"          # Just informational


class ConfidenceLevel(str, PyEnum):
    """How confident is the AI in its finding."""
    HIGH = "high"      # Very sure
    MEDIUM = "medium"  # Somewhat sure
    LOW = "low"        # Might be wrong


class VulnerabilityType(str, PyEnum):
    """Types of vulnerabilities we detect."""
    REENTRANCY = "reentrancy"
    INTEGER_OVERFLOW = "integer_overflow"
    ACCESS_CONTROL = "access_control"
    UNCHECKED_CALL = "unchecked_call"
    FRONTRUNNING = "frontrunning"
    OTHER = "other"


class AnalysisStatus(str, PyEnum):
    """Current state of an analysis."""
    PENDING = "pending"        # Waiting to start
    PROCESSING = "processing"  # Currently running
    COMPLETED = "completed"    # Finished successfully
    FAILED = "failed"          # Something went wrong


# ============ DATABASE TABLES ============

class Contract(Base):
    """
    Stores smart contracts that have been submitted for analysis.
    
    One contract can have many analyses (if scanned multiple times).
    """
    __tablename__ = "contracts"

    # Primary key - unique identifier
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Contract info
    name = Column(String(255), nullable=False, index=True)
    code = Column(Text, nullable=False)  # The actual Solidity code
    code_hash = Column(String(64), nullable=False, index=True)  # SHA256 hash
    
    # Blockchain info
    network = Column(Enum(Network), default=Network.POLYGON)
    address = Column(String(42), nullable=True, index=True)  # If from blockchain
    verified = Column(Boolean, default=False)  # Verified on explorer?
    compiler_version = Column(String(20), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship: one contract has many analyses
    analyses = relationship(
        "Analysis",
        back_populates="contract",
        cascade="all, delete-orphan"  # Delete analyses if contract is deleted
    )


class Analysis(Base):
    """
    Stores the results of scanning a contract.
    
    One analysis belongs to one contract.
    One analysis can have many vulnerabilities.
    """
    __tablename__ = "analyses"

    # Primary key
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Foreign key - links to contract
    contract_id = Column(
        String(36),
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Results
    overall_risk = Column(Enum(SeverityLevel), nullable=True)
    risk_score = Column(Integer, nullable=True)  # 0-100
    summary = Column(Text, nullable=True)
    
    # Performance
    scan_duration_ms = Column(Integer, nullable=True)
    
    # Status tracking
    status = Column(Enum(AnalysisStatus), default=AnalysisStatus.PENDING)
    error_message = Column(Text, nullable=True)
    
    # Statistics
    total_lines = Column(Integer, nullable=True)
    vulnerable_lines = Column(Integer, nullable=True)
    functions_analyzed = Column(Integer, nullable=True)
    
    # AI models used
    detection_model = Column(String(50), default="deepseek-coder-v2")
    explanation_model = Column(String(50), default="llama3.1:8b")
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    contract = relationship("Contract", back_populates="analyses")
    vulnerabilities = relationship(
        "Vulnerability",
        back_populates="analysis",
        cascade="all, delete-orphan"
    )


class Vulnerability(Base):
    """
    Stores individual vulnerabilities found during analysis.
    
    One vulnerability belongs to one analysis.
    """
    __tablename__ = "vulnerabilities"

    # Primary key
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Foreign key - links to analysis
    analysis_id = Column(
        String(36),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Classification
    type = Column(Enum(VulnerabilityType), nullable=False)
    severity = Column(Enum(SeverityLevel), nullable=False)
    confidence = Column(Enum(ConfidenceLevel), default=ConfidenceLevel.MEDIUM)
    verified = Column(Boolean, default=False)  # Confirmed by Foundry?
    
    # Location in code
    line_start = Column(Integer, nullable=True)
    line_end = Column(Integer, nullable=True)
    function_name = Column(String(255), nullable=True)
    code_snippet = Column(Text, nullable=True)
    
    # Explanation
    description = Column(Text, nullable=False)  # What's wrong
    impact = Column(Text, nullable=True)        # Why it's dangerous
    recommendation = Column(Text, nullable=True) # How to fix
    fixed_code = Column(Text, nullable=True)    # Corrected code
    
    # Extra info
    gas_estimate = Column(String(50), nullable=True)
    references = Column(JSON, nullable=True)  # Links to resources
    
    # Foundry test results
    test_code = Column(Text, nullable=True)    # Generated test
    test_output = Column(Text, nullable=True)  # Test results
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    analysis = relationship("Analysis", back_populates="vulnerabilities")