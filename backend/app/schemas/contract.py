from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re


class NetworkEnum(str, Enum):
    """Supported blockchain networks."""
    POLYGON = "polygon"
    ETHEREUM = "ethereum"
    ARBITRUM = "arbitrum"
    OPTIMISM = "optimism"
    BASE = "base"


# ============ REQUEST SCHEMAS ============
# These define what data we RECEIVE from users

class ContractCodeInput(BaseModel):
    """
    Request body for analyzing contract by code upload.
    
    Example:
    {
        "contract_name": "MyToken",
        "contract_code": "pragma solidity ^0.8.0; ...",
        "network": "polygon"
    }
    """
    contract_name: str = Field(
        ...,  # Required field
        min_length=1,
        max_length=255,
        description="Name of the contract"
    )
    contract_code: str = Field(
        ...,
        min_length=10,
        description="Solidity source code"
    )
    network: NetworkEnum = Field(
        default=NetworkEnum.POLYGON,
        description="Target blockchain network"
    )

    @field_validator("contract_code")
    @classmethod
    def validate_solidity_code(cls, v: str) -> str:
        """Check that the code looks like valid Solidity."""
        # Must contain pragma statement
        if not re.search(r'pragma\s+solidity', v, re.IGNORECASE):
            raise ValueError("Code must contain a 'pragma solidity' statement")
        
        # Must contain contract or interface or library
        if not re.search(r'(contract|interface|library)\s+\w+', v, re.IGNORECASE):
            raise ValueError("Code must contain a contract, interface, or library definition")
        
        return v


class ContractAddressInput(BaseModel):
    """
    Request body for analyzing contract by blockchain address.
    
    Example:
    {
        "address": "0x1234567890abcdef1234567890abcdef12345678",
        "network": "polygon"
    }
    """
    address: str = Field(
        ...,
        description="Contract address on blockchain"
    )
    network: NetworkEnum = Field(
        default=NetworkEnum.POLYGON,
        description="Blockchain network where contract is deployed"
    )

    @field_validator("address")
    @classmethod
    def validate_address(cls, v: str) -> str:
        """Check that address is valid Ethereum format."""
        # Remove whitespace
        v = v.strip()
        
        # Must match 0x + 40 hex characters
        if not re.match(r'^0x[a-fA-F0-9]{40}$', v):
            raise ValueError("Invalid address format. Must be 0x followed by 40 hex characters")
        
        # Return lowercase for consistency
        return v.lower()


# ============ RESPONSE SCHEMAS ============
# These define what data we SEND back to users

class ContractBase(BaseModel):
    """Base contract fields shared by multiple schemas."""
    id: str
    name: str
    network: NetworkEnum
    address: Optional[str] = None
    verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class ContractSummary(ContractBase):
    """
    Brief contract info for list views.
    
    Used when showing multiple contracts (doesn't include full code).
    """
    latest_risk: Optional[str] = None
    analysis_count: int = 0


class ContractDetail(ContractBase):
    """
    Full contract info including code.
    
    Used when viewing a single contract.
    """
    code: str
    code_hash: str
    compiler_version: Optional[str] = None
    updated_at: Optional[datetime] = None


class ContractListResponse(BaseModel):
    """Response for listing multiple contracts."""
    total: int
    skip: int
    limit: int
    contracts: List[ContractSummary]