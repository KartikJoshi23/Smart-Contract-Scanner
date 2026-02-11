"""
Report generation endpoints.

Endpoints for downloading analysis reports in various formats.
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.db import models

router = APIRouter(prefix="/reports")


@router.get("/{analysis_id}/json")
async def get_json_report(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Get analysis report as JSON.
    
    Returns the complete analysis data in JSON format.
    Useful for programmatic access or custom processing.
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
    
    # Build comprehensive report
    report = {
        "report_type": "json",
        "generated_at": datetime.utcnow().isoformat(),
        "contract": {
            "id": contract.id,
            "name": contract.name,
            "network": contract.network.value,
            "address": contract.address,
            "code_hash": contract.code_hash,
            "code": contract.code
        },
        "analysis": {
            "id": analysis.id,
            "status": analysis.status.value,
            "overall_risk": analysis.overall_risk.value if analysis.overall_risk else None,
            "risk_score": analysis.risk_score,
            "summary": analysis.summary,
            "scan_duration_ms": analysis.scan_duration_ms,
            "total_lines": analysis.total_lines,
            "vulnerable_lines": analysis.vulnerable_lines,
            "functions_analyzed": analysis.functions_analyzed,
            "detection_model": analysis.detection_model,
            "explanation_model": analysis.explanation_model,
            "created_at": analysis.created_at.isoformat(),
            "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None
        },
        "vulnerabilities": [
            {
                "id": v.id,
                "type": v.type.value,
                "severity": v.severity.value,
                "confidence": v.confidence.value,
                "verified": v.verified,
                "location": {
                    "line_start": v.line_start,
                    "line_end": v.line_end,
                    "function_name": v.function_name
                },
                "code_snippet": v.code_snippet,
                "description": v.description,
                "impact": v.impact,
                "recommendation": v.recommendation,
                "fixed_code": v.fixed_code,
                "gas_estimate": v.gas_estimate,
                "references": v.references
            }
            for v in analysis.vulnerabilities
        ],
        "statistics": {
            "total_vulnerabilities": len(analysis.vulnerabilities),
            "by_severity": {},
            "by_type": {}
        }
    }
    
    # Calculate statistics
    for v in analysis.vulnerabilities:
        severity = v.severity.value
        vtype = v.type.value
        
        report["statistics"]["by_severity"][severity] = \
            report["statistics"]["by_severity"].get(severity, 0) + 1
        
        report["statistics"]["by_type"][vtype] = \
            report["statistics"]["by_type"].get(vtype, 0) + 1
    
    return JSONResponse(content=report)


@router.get("/{analysis_id}/pdf")
async def get_pdf_report(
    analysis_id: str,
    db: Session = Depends(get_db)
):
    """
    Get analysis report as PDF.
    
    Downloads a formatted PDF report of the analysis.
    Great for sharing with team members or clients.
    """
    # Check analysis exists
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
    
    # TODO: Implement PDF generation
    raise HTTPException(
        status_code=501,
        detail={
            "error": "not_implemented",
            "message": "PDF report generation coming soon! Use /reports/{id}/json for now."
        }
    )


# Need to import datetime for the report
from datetime import datetime