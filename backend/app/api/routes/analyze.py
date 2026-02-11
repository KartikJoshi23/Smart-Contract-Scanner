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
    VulnerabilityDetail,
)
from app.core.exceptions import ValidationError, ContractNotFoundError
from app.services import analysis_orchestrator, ai_analyzer

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
    """
    if not await ai_analyzer.check_connection():
        raise HTTPException(
            status_code=503,
            detail={
                "error": "ai_unavailable",
                "message": "AI service (Ollama) is not available. Please make sure Ollama is running."
            }
        )
    
    code_hash = get_code_hash(input.contract_code)
    
    existing_contract = db.query(models.Contract).filter(
        models.Contract.code_hash == code_hash
    ).first()
    
    if existing_contract:
        contract = existing_contract
    else:
        contract = models.Contract(
            name=input.contract_name,
            code=input.contract_code,
            code_hash=code_hash,
            network=input.network.value
        )
        db.add(contract)
        db.commit()
        db.refresh(contract)
    
    analysis = models.Analysis(
        contract_id=contract.id,
        status=models.AnalysisStatus.PENDING,
        detection_model=ai_analyzer.detection_model,
        explanation_model=ai_analyzer.explanation_model
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    
    try:
        analysis = await analysis_orchestrator.analyze_contract(
            db=db,
            analysis_id=analysis.id,
            contract_code=input.contract_code
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": "analysis_failed",
                "message": str(e)
            }
        )
    
    vulnerabilities = []
    for vuln in analysis.vulnerabilities:
        vulnerabilities.append(VulnerabilityDetail(
            id=vuln.id,
            type=vuln.type.value,
            severity=vuln.severity.value,
            confidence=vuln.confidence.value,
            verified=vuln.verified,
            line_start=vuln.line_start,
            line_end=vuln.line_end,
            function_name=vuln.function_name,
            code_snippet=vuln.code_snippet,
            description=vuln.description,
            impact=vuln.impact,
            recommendation=vuln.recommendation,
            fixed_code=vuln.fixed_code,
            gas_estimate=vuln.gas_estimate,
            references=vuln.references,
            test_code=vuln.test_code,
            test_output=vuln.test_output,
            created_at=vuln.created_at
        ))
    
    return AnalysisResult(
        id=analysis.id,
        contract_id=contract.id,
        contract_name=contract.name,
        status=AnalysisStatusEnum(analysis.status.value),
        overall_risk=SeverityEnum(analysis.overall_risk) if analysis.overall_risk else None,
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


@router.post("/address", response_model=AnalysisResult)
async def analyze_address(
    input: ContractAddressInput,
    db: Session = Depends(get_db)
):
    """
    Analyze a smart contract from blockchain address.
    """
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
    
    contract = analysis.contract
    
    vulnerabilities = []
    for vuln in analysis.vulnerabilities:
        vulnerabilities.append(VulnerabilityDetail(
            id=vuln.id,
            type=vuln.type.value,
            severity=vuln.severity.value,
            confidence=vuln.confidence.value,
            verified=vuln.verified,
            line_start=vuln.line_start,
            line_end=vuln.line_end,
            function_name=vuln.function_name,
            code_snippet=vuln.code_snippet,
            description=vuln.description,
            impact=vuln.impact,
            recommendation=vuln.recommendation,
            fixed_code=vuln.fixed_code,
            gas_estimate=vuln.gas_estimate,
            references=vuln.references,
            test_code=vuln.test_code,
            test_output=vuln.test_output,
            created_at=vuln.created_at
        ))
    
    return AnalysisResult(
        id=analysis.id,
        contract_id=contract.id,
        contract_name=contract.name,
        status=AnalysisStatusEnum(analysis.status.value),
        overall_risk=SeverityEnum(analysis.overall_risk.value) if analysis.overall_risk else None,
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
        status=AnalysisStatusEnum(analysis.status.value),
        progress=progress_map.get(analysis.status, 0),
        current_step=current_step_map.get(analysis.status, "Unknown"),
        steps_completed=steps_map.get(analysis.status, []),
        estimated_time_remaining_ms=None if analysis.status in [
            models.AnalysisStatus.COMPLETED,
            models.AnalysisStatus.FAILED
        ] else 30000
    )