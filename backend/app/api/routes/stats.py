"""
Statistics endpoints.

Endpoints for retrieving application-wide statistics.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.api.deps import get_db
from app.db import models
from app.schemas import StatsResponse

router = APIRouter(prefix="/stats")


@router.get("/", response_model=StatsResponse)
async def get_statistics(
    db: Session = Depends(get_db)
):
    """
    Get overall application statistics.
    
    Returns:
    - Total counts (contracts, analyses, vulnerabilities)
    - Breakdowns by severity and type
    - Recent activity stats
    """
    # Total counts
    total_contracts = db.query(func.count(models.Contract.id)).scalar() or 0
    total_analyses = db.query(func.count(models.Analysis.id)).scalar() or 0
    total_vulnerabilities = db.query(func.count(models.Vulnerability.id)).scalar() or 0
    
    # Vulnerabilities by severity
    severity_counts = db.query(
        models.Vulnerability.severity,
        func.count(models.Vulnerability.id)
    ).group_by(models.Vulnerability.severity).all()
    
    vulnerabilities_by_severity = {
        "critical": 0,
        "high": 0,
        "medium": 0,
        "low": 0,
        "info": 0
    }
    for severity, count in severity_counts:
        vulnerabilities_by_severity[severity.value] = count
    
    # Vulnerabilities by type
    type_counts = db.query(
        models.Vulnerability.type,
        func.count(models.Vulnerability.id)
    ).group_by(models.Vulnerability.type).all()
    
    vulnerabilities_by_type = {
        "reentrancy": 0,
        "integer_overflow": 0,
        "access_control": 0,
        "unchecked_call": 0,
        "frontrunning": 0,
        "other": 0
    }
    for vtype, count in type_counts:
        vulnerabilities_by_type[vtype.value] = count
    
    # Average scan time
    avg_scan_time = db.query(
        func.avg(models.Analysis.scan_duration_ms)
    ).filter(
        models.Analysis.status == models.AnalysisStatus.COMPLETED,
        models.Analysis.scan_duration_ms.isnot(None)
    ).scalar()
    
    average_scan_time_ms = int(avg_scan_time) if avg_scan_time else 0
    
    # Scans today
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    scans_today = db.query(func.count(models.Analysis.id)).filter(
        models.Analysis.created_at >= today_start
    ).scalar() or 0
    
    # Scans this week
    week_start = datetime.utcnow() - timedelta(days=7)
    scans_this_week = db.query(func.count(models.Analysis.id)).filter(
        models.Analysis.created_at >= week_start
    ).scalar() or 0
    
    return StatsResponse(
        total_contracts=total_contracts,
        total_analyses=total_analyses,
        total_vulnerabilities=total_vulnerabilities,
        vulnerabilities_by_severity=vulnerabilities_by_severity,
        vulnerabilities_by_type=vulnerabilities_by_type,
        average_scan_time_ms=average_scan_time_ms,
        scans_today=scans_today,
        scans_this_week=scans_this_week
    )


@router.get("/recent")
async def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get recent analysis activity.
    
    Returns the most recent analyses across all contracts.
    """
    recent_analyses = db.query(models.Analysis).order_by(
        models.Analysis.created_at.desc()
    ).limit(limit).all()
    
    return {
        "recent_analyses": [
            {
                "id": a.id,
                "contract_id": a.contract_id,
                "contract_name": a.contract.name,
                "status": a.status.value,
                "overall_risk": a.overall_risk.value if a.overall_risk else None,
                "vulnerability_count": len(a.vulnerabilities),
                "created_at": a.created_at.isoformat()
            }
            for a in recent_analyses
        ]
    }