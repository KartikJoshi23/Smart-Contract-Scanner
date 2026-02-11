"""
Analysis endpoints.

These are the main endpoints for scanning smart contracts.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
import hashlib
from datetime import datetime

from app.api.deps import get_db
from app.db import models
from app.schemas import (
    ContractCodeInput,
    ContractAddressInput,
    AnalysisResult,
    AnalysisProgress,
    AnalysisStatusEnum,
    SeverityEnum,
)
from app.core.exceptions import ValidationError, ContractNotFoundError

router = APIRouter(prefix="/analyze")


def get_code_hash(code: str) -> str:
    """Generate SHA256 hash of contract code."""
    return hashlib.sha256(code.encode()).hexdigest()


@router.post("/code", response_model=AnalysisResult)
async def analyze_code(
    input: ContractCodeInput,
    db: Session = Depends(get_db)
):
    """
    Analyze a smart contract from source code.
    
    This endpoint:
    1. Validates the Solidity code
    2. Saves the contract to database
    3. Runs AI analysis
    4. Returns vulnerabilities found
    
    **Example Request:**
    ```json
    {
        "contract_name": "MyToken",
        "contract_code": "pragma solidity ^0.8.0; contract MyToken { ... }",
        "network": "polygon"
    }
    ```
    """
    # Generate code hash
    code_hash = get_code_hash(input.contract_code)
    
    # Check if contract already exists
    existing_contract = db.query(models.Contract).filter(
        models.Contract.code_hash == code_hash
    ).first()
    
    if existing_contract:
        contract = existing_contract
    else:
        # Create new contract record
        contract = models.Contract(
            name=input.contract_name,
            code=input.contract_code,
            code_hash=code_hash,
            network=input.network.value
        )
        db.add(contract)
        db.commit()
        db.refresh(contract)
    
    # Create analysis record
    analysis = models.Analysis(
        contract_id=contract.id,
        status=models.AnalysisStatus.PROCESSING
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    # TODO: Run actual AI analysis here
    # For now, return a placeholder result
    
    # Update analysis as completed (placeholder)
    analysis.status = models.AnalysisStatus.COMPLETED
    analysis.overall_risk = models.SeverityLevel.INFO
    analysis.risk_score = 0
    analysis.summary = "Analysis complete. This is a placeholder - AI integration coming soon!"
    analysis.scan_duration_ms = 100
    analysis.completed_at = datetime.utcnow()
    analysis.total_lines = len(input.contract_code.split('\n'))
    analysis.vulnerable_lines = 0
    analysis.functions_analyzed = 0
    db.commit()
    db.refresh(analysis)
    
    return AnalysisResult(
        id=analysis.id,
        contract_id=contract.id,
        contract_name=contract.name,
        status=AnalysisStatusEnum.COMPLETED,
        overall_risk=SeverityEnum.INFO,
        risk_score=0,
        summary=analysis.summary,
        scan_duration_ms=analysis.scan_duration_ms,
        total_lines=analysis.total_lines,
        vulnerable_lines=0,
        functions_analyzed=0,
        vulnerabilities=[],
        created_at=analysis.created_at,
        completed_at=analysis.completed_at
    )


@router.post("/address", response_model=AnalysisResult)
async def analyze_address(
    input: ContractAddressInput,
    db: Session = Depends(get_db)
):
    """
    Analyze a smart contract from blockchain address.
    
    This endpoint:
    1. Fetches contract code from blockchain
    2. Runs the same analysis as /analyze/code
    
    **Example Request:**
    ```json
    {
        "address": "0x1234567890abcdef1234567890abcdef12345678",
        "network": "polygon"
    }
    ```
    """
    # TODO: Implement contract fetching from blockchain
    # For now, return a placeholder error
    
    raise HTTPException(
        status_code=501,
        detail={
            "error": "not_implemented",
            "message": "Address analysis coming soon! Please use /analyze/code for now.",
            "address": input.address,
            "network": input.network.value
        }
    )


@router.get("/{analysis_id}", response_model=AnalysisResult)
async def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Get analysis results by ID.
    
    Use this to retrieve results of a previous analysis.
    """
    analysis = db.query(models.Analysis).filter(
        models.Analysis.id == analysis_id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "not_found",
                "message": f"Analysis with ID '{analysis_id}' not found"
            }
        )
    
    # Get associated contract
    contract = analysis.contract
    
    # Get vulnerabilities
    vulnerabilities = []
    for vuln in analysis.vulnerabilities:
        vulnerabilities.append({
            "id": vuln.id,
            "type": vuln.type.value,
            "severity": vuln.severity.value,
            "confidence": vuln.confidence.value,
            "verified": vuln.verified,
            "line_start": vuln.line_start,
            "line_end": vuln.line_end,
            "function_name": vuln.function_name,
            "code_snippet": vuln.code_snippet,
            "description": vuln.description,
            "impact": vuln.impact,
            "recommendation": vuln.recommendation,
            "fixed_code": vuln.fixed_code,
            "gas_estimate": vuln.gas_estimate,
            "references": vuln.references,
            "test_code": vuln.test_code,
            "test_output": vuln.test_output,
            "created_at": vuln.created_at
        })
    
    return AnalysisResult(
        id=analysis.id,
        contract_id=contract.id,
        contract_name=contract.name,
        status=analysis.status.value,
        overall_risk=analysis.overall_risk.value if analysis.overall_risk else None,
        risk_score=analysis.risk_score,
        summary=analysis.summary,
        scan_duration_ms=analysis.scan_duration_ms,
        total_lines=analysis.total_lines,
        vulnerable_lines=analysis.vulnerable_lines,
        functions_analyzed=analysis.functions_analyzed,
        detection_model=analysis.detection_model,
        explanation_model=analysis.explanation_model,
        vulnerabilities=vulnerabilities,
        error_message=analysis.error_message,
        created_at=analysis.created_at,
        completed_at=analysis.completed_at
    )


@router.get("/{analysis_id}/status", response_model=AnalysisProgress)
async def get_analysis_status(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Get current status of an analysis.
    
    Use this for polling during long-running analyses.
    """
    analysis = db.query(models.Analysis).filter(
        models.Analysis.id == analysis_id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "not_found",
                "message": f"Analysis with ID '{analysis_id}' not found"
            }
        )
    
    # Determine progress based on status
    progress_map = {
        models.AnalysisStatus.PENDING: 0,
        models.AnalysisStatus.PROCESSING: 50,
        models.AnalysisStatus.COMPLETED: 100,
        models.AnalysisStatus.FAILED: 100
    }
    
    steps_map = {
        models.AnalysisStatus.PENDING: [],
        models.AnalysisStatus.PROCESSING: ["Received contract", "Running AI analysis"],
        models.AnalysisStatus.COMPLETED: ["Received contract", "AI analysis complete", "Report generated"],
        models.AnalysisStatus.FAILED: ["Received contract", "Analysis failed"]
    }
    
    current_step_map = {
        models.AnalysisStatus.PENDING: "Waiting to start",
        models.AnalysisStatus.PROCESSING: "Analyzing with AI",
        models.AnalysisStatus.COMPLETED: "Complete",
        models.AnalysisStatus.FAILED: "Failed"
    }
    
    return AnalysisProgress(
        analysis_id=analysis.id,
        status=analysis.status.value,
        progress=progress_map.get(analysis.status, 0),
        current_step=current_step_map.get(analysis.status, "Unknown"),
        steps_completed=steps_map.get(analysis.status, []),
        estimated_time_remaining_ms=None if analysis.status in [
            models.AnalysisStatus.COMPLETED,
            models.AnalysisStatus.FAILED
        ] else 30000
    )