"""
Contract management endpoints.

CRUD operations for smart contracts.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional

from app.api.deps import get_db
from app.db import models
from app.schemas import (
    ContractSummary,
    ContractDetail,
    ContractListResponse,
)

router = APIRouter(prefix="/contracts")


@router.get("/", response_model=ContractListResponse)
async def list_contracts(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Max records to return"),
    network: Optional[str] = Query(None, description="Filter by network"),
    db: Session = Depends(get_db)
):
    """
    List all analyzed contracts.
    
    Supports pagination and filtering by network.
    
    **Query Parameters:**
    - `skip`: Number of records to skip (for pagination)
    - `limit`: Maximum number of records to return (1-100)
    - `network`: Filter by blockchain network (optional)
    """
    # Build query
    query = db.query(models.Contract)
    
    # Apply network filter if provided
    if network:
        query = query.filter(models.Contract.network == network)
    
    # Get total count
    total = query.count()
    
    # Apply pagination and ordering
    contracts = query.order_by(
        desc(models.Contract.created_at)
    ).offset(skip).limit(limit).all()
    
    # Build response
    contract_summaries = []
    for contract in contracts:
        # Get latest analysis for this contract
        latest_analysis = db.query(models.Analysis).filter(
            models.Analysis.contract_id == contract.id,
            models.Analysis.status == models.AnalysisStatus.COMPLETED
        ).order_by(desc(models.Analysis.created_at)).first()
        
        # Count analyses
        analysis_count = db.query(models.Analysis).filter(
            models.Analysis.contract_id == contract.id
        ).count()
        
        contract_summaries.append(ContractSummary(
            id=contract.id,
            name=contract.name,
            network=contract.network.value,
            address=contract.address,
            verified=contract.verified,
            created_at=contract.created_at,
            latest_risk=latest_analysis.overall_risk.value if latest_analysis and latest_analysis.overall_risk else None,
            analysis_count=analysis_count
        ))
    
    return ContractListResponse(
        total=total,
        skip=skip,
        limit=limit,
        contracts=contract_summaries
    )


@router.get("/{contract_id}", response_model=ContractDetail)
async def get_contract(
    contract_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a specific contract by ID.
    
    Returns full contract details including source code.
    """
    contract = db.query(models.Contract).filter(
        models.Contract.id == contract_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "not_found",
                "message": f"Contract with ID '{contract_id}' not found"
            }
        )
    
    return ContractDetail(
        id=contract.id,
        name=contract.name,
        code=contract.code,
        code_hash=contract.code_hash,
        network=contract.network.value,
        address=contract.address,
        verified=contract.verified,
        compiler_version=contract.compiler_version,
        created_at=contract.created_at,
        updated_at=contract.updated_at
    )


@router.delete("/{contract_id}")
async def delete_contract(
    contract_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete a contract and all its analyses.
    
    **Warning:** This action cannot be undone!
    """
    contract = db.query(models.Contract).filter(
        models.Contract.id == contract_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "not_found",
                "message": f"Contract with ID '{contract_id}' not found"
            }
        )
    
    # Delete contract (cascades to analyses and vulnerabilities)
    contract_name = contract.name
    db.delete(contract)
    db.commit()
    
    return {
        "success": True,
        "message": f"Contract '{contract_name}' and all its analyses have been deleted"
    }


@router.get("/{contract_id}/analyses")
async def get_contract_analyses(
    contract_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """
    Get all analyses for a specific contract.
    
    Use this to see the history of scans for a contract.
    """
    # Check contract exists
    contract = db.query(models.Contract).filter(
        models.Contract.id == contract_id
    ).first()
    
    if not contract:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "not_found",
                "message": f"Contract with ID '{contract_id}' not found"
            }
        )
    
    # Get analyses
    analyses = db.query(models.Analysis).filter(
        models.Analysis.contract_id == contract_id
    ).order_by(
        desc(models.Analysis.created_at)
    ).offset(skip).limit(limit).all()
    
    total = db.query(models.Analysis).filter(
        models.Analysis.contract_id == contract_id
    ).count()
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "contract_id": contract_id,
        "contract_name": contract.name,
        "analyses": [
            {
                "id": a.id,
                "status": a.status.value,
                "overall_risk": a.overall_risk.value if a.overall_risk else None,
                "risk_score": a.risk_score,
                "vulnerability_count": len(a.vulnerabilities),
                "scan_duration_ms": a.scan_duration_ms,
                "created_at": a.created_at,
                "completed_at": a.completed_at
            }
            for a in analyses
        ]
    }