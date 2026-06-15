import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import time

from database import get_db, engine, SessionLocal
import models
import schemas
from scanner import ContractScanner
from services.alchemy_service import alchemy_service
from services.chat_service import chat_service

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Contract Security Scanner",
    description="AI-powered smart contract vulnerability detection",
    version="1.0.0"
)

# CORS middleware — configurable origins (set ALLOWED_ORIGINS in env for production)
allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Session-Id"],
)

# Initialize scanner
scanner = ContractScanner()


@app.get("/")
async def root():
    return {
        "name": "Smart Contract Security Scanner",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/api/health", response_model=schemas.HealthResponse)
async def health_check():
    """Check the health of all services."""
    ai_status = await scanner.check_ai_connection()
    
    return {
        "status": "healthy" if ai_status else "degraded",
        "version": "1.0.0",
        "services": {
            "database": "connected",
            "ai": "connected" if ai_status else "disconnected"
        }
    }


@app.post("/api/analyze", response_model=schemas.AnalysisResponse)
async def analyze_contract(
    request: schemas.ContractAnalysisRequest,
    db: Session = Depends(get_db)
):
    """Analyze a smart contract for vulnerabilities."""
    start_time = time.time()
    
    # Create or get contract record
    contract = models.Contract(
        name=request.contract_name,
        source_code=request.contract_code,
        network=request.network
    )
    db.add(contract)
    db.commit()
    db.refresh(contract)
    
    # Perform analysis
    try:
        result = await scanner.analyze(request.contract_code)
        
        scan_duration = int((time.time() - start_time) * 1000)
        
        # Create analysis record
        analysis = models.Analysis(
            contract_id=contract.id,
            risk_score=result.get("risk_score", 0),
            summary=result.get("summary", ""),
            scan_duration_ms=scan_duration
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)
        
        # Store vulnerabilities
        vulnerabilities = []
        for vuln_data in result.get("vulnerabilities", []):
            vuln = models.Vulnerability(
                analysis_id=analysis.id,
                title=vuln_data.get("title", "Unknown"),
                severity=vuln_data.get("severity", "medium"),
                category=vuln_data.get("category", "general"),
                description=vuln_data.get("description", ""),
                impact=vuln_data.get("impact", ""),
                recommendation=vuln_data.get("recommendation", ""),
                vulnerable_code=vuln_data.get("vulnerable_code", ""),
                fixed_code=vuln_data.get("fixed_code", ""),
                line_start=vuln_data.get("line_start"),
                line_end=vuln_data.get("line_end"),
                function_name=vuln_data.get("function_name", ""),
                confidence=vuln_data.get("confidence", "medium")
            )
            db.add(vuln)
            vulnerabilities.append(vuln)
        
        db.commit()
        
        # Prepare response
        return {
            "id": str(analysis.id),
            "contract_name": contract.name,
            "network": contract.network,
            "risk_score": analysis.risk_score,
            "overall_risk": _calculate_overall_risk(analysis.risk_score),
            "summary": analysis.summary,
            "vulnerabilities": [
                {
                    "id": str(v.id),
                    "title": v.title,
                    "severity": v.severity,
                    "category": v.category,
                    "description": v.description,
                    "impact": v.impact,
                    "recommendation": v.recommendation,
                    "vulnerable_code": v.vulnerable_code,
                    "fixed_code": v.fixed_code,
                    "line_start": v.line_start,
                    "line_end": v.line_end,
                    "function_name": v.function_name,
                    "confidence": v.confidence
                }
                for v in vulnerabilities
            ],
            "scan_duration_ms": scan_duration,
            "total_lines": len(request.contract_code.split("\n")),
            "created_at": analysis.created_at.isoformat()
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/fetch-contract", response_model=schemas.FetchContractResponse)
async def fetch_contract(request: schemas.FetchContractRequest):
    """Fetch verified contract source code from blockchain."""
    
    # Validate address format
    address = request.address.strip()
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(
            status_code=400, 
            detail="Invalid contract address format. Must be 42 characters starting with 0x"
        )
    
    # Check if it's a contract
    is_contract = await alchemy_service.is_contract(address, request.network)
    if not is_contract:
        raise HTTPException(
            status_code=400,
            detail="Address is not a contract or does not exist on this network"
        )
    
    # Fetch source code
    result = await alchemy_service.get_contract_source(address, request.network)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to fetch contract data")
    
    if not result.get("is_verified", False):
        raise HTTPException(
            status_code=404,
            detail=result.get("error", "Contract source code is not verified on this network")
        )
    
    return {
        "address": result["address"],
        "network": result["network"],
        "contract_name": result["contract_name"],
        "source_code": result["source_code"],
        "compiler_version": result.get("compiler_version", ""),
        "is_verified": result["is_verified"]
    }


@app.get("/api/contract-info/{network}/{address}")
async def get_contract_info(network: str, address: str):
    """Get basic contract information."""
    
    if not address.startswith("0x") or len(address) != 42:
        raise HTTPException(status_code=400, detail="Invalid contract address")
    
    info = await alchemy_service.get_contract_info(address, network)
    return info


@app.get("/api/stats", response_model=schemas.StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """Get scanner statistics."""
    
    total_contracts = db.query(models.Contract).count()
    total_analyses = db.query(models.Analysis).count()
    total_vulnerabilities = db.query(models.Vulnerability).count()
    
    # Today's scans
    today = datetime.utcnow().date()
    scans_today = db.query(models.Analysis).filter(
        models.Analysis.created_at >= datetime.combine(today, datetime.min.time())
    ).count()
    
    # This week's scans
    week_ago = datetime.utcnow() - timedelta(days=7)
    scans_this_week = db.query(models.Analysis).filter(
        models.Analysis.created_at >= week_ago
    ).count()
    
    # Average scan time
    analyses = db.query(models.Analysis).all()
    avg_scan_time = 0
    if analyses:
        total_time = sum(a.scan_duration_ms or 0 for a in analyses)
        avg_scan_time = total_time / len(analyses)
    
    return {
        "total_contracts": total_contracts,
        "total_analyses": total_analyses,
        "total_vulnerabilities": total_vulnerabilities,
        "scans_today": scans_today,
        "scans_this_week": scans_this_week,
        "average_scan_time_ms": int(avg_scan_time)
    }


@app.get("/api/history", response_model=list[schemas.HistoryItem])
async def get_history(
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get analysis history."""
    
    analyses = db.query(models.Analysis)\
        .join(models.Contract)\
        .order_by(models.Analysis.created_at.desc())\
        .offset(offset)\
        .limit(limit)\
        .all()
    
    return [
        {
            "id": str(a.id),
            "contract_name": a.contract.name,
            "network": a.contract.network,
            "risk_score": a.risk_score,
            "vulnerability_count": len(a.vulnerabilities),
            "created_at": a.created_at.isoformat()
        }
        for a in analyses
    ]


@app.get("/api/history/{analysis_id}", response_model=schemas.ReportResponse)
async def get_analysis_detail(analysis_id: int, db: Session = Depends(get_db)):
    """Get a single analysis with full details."""
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    contract = analysis.contract
    return {
        "id": str(analysis.id),
        "contract_name": contract.name,
        "network": contract.network,
        "source_code": contract.source_code,
        "risk_score": analysis.risk_score,
        "overall_risk": _calculate_overall_risk(analysis.risk_score),
        "summary": analysis.summary or "",
        "vulnerabilities": [
            {
                "id": str(v.id),
                "title": v.title,
                "severity": v.severity,
                "category": v.category or "",
                "description": v.description or "",
                "impact": v.impact or "",
                "recommendation": v.recommendation or "",
                "vulnerable_code": v.vulnerable_code or "",
                "fixed_code": v.fixed_code or "",
                "line_start": v.line_start,
                "line_end": v.line_end,
                "function_name": v.function_name or "",
                "confidence": v.confidence or "medium",
            }
            for v in analysis.vulnerabilities
        ],
        "scan_duration_ms": analysis.scan_duration_ms or 0,
        "total_lines": len(contract.source_code.split("\n")),
        "created_at": analysis.created_at.isoformat(),
    }


@app.get("/api/reports/{analysis_id}/json", response_model=schemas.ReportResponse)
async def export_json_report(analysis_id: int, db: Session = Depends(get_db)):
    """Export a full analysis report as JSON."""
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    contract = analysis.contract
    return {
        "id": str(analysis.id),
        "contract_name": contract.name,
        "network": contract.network,
        "source_code": contract.source_code,
        "risk_score": analysis.risk_score,
        "overall_risk": _calculate_overall_risk(analysis.risk_score),
        "summary": analysis.summary or "",
        "vulnerabilities": [
            {
                "id": str(v.id),
                "title": v.title,
                "severity": v.severity,
                "category": v.category or "",
                "description": v.description or "",
                "impact": v.impact or "",
                "recommendation": v.recommendation or "",
                "vulnerable_code": v.vulnerable_code or "",
                "fixed_code": v.fixed_code or "",
                "line_start": v.line_start,
                "line_end": v.line_end,
                "function_name": v.function_name or "",
                "confidence": v.confidence or "medium",
            }
            for v in analysis.vulnerabilities
        ],
        "scan_duration_ms": analysis.scan_duration_ms or 0,
        "total_lines": len(contract.source_code.split("\n")),
        "created_at": analysis.created_at.isoformat(),
    }


@app.get("/api/reports/{analysis_id}/pdf")
async def export_pdf_report(analysis_id: int, db: Session = Depends(get_db)):
    """Export a full analysis report as a PDF file."""
    from fastapi.responses import StreamingResponse
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    import io

    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    contract = analysis.contract
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=40, bottomMargin=40)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=18, spaceAfter=12)
    elements.append(Paragraph("Smart Contract Security Report", title_style))
    elements.append(Spacer(1, 12))

    # Contract Info table
    risk_level = _calculate_overall_risk(analysis.risk_score).upper()
    info_data = [
        ["Contract", contract.name],
        ["Network", contract.network.capitalize()],
        ["Risk Score", f"{analysis.risk_score}/100 ({risk_level})"],
        ["Vulnerabilities", str(len(analysis.vulnerabilities))],
        ["Scan Duration", f"{analysis.scan_duration_ms or 0}ms"],
        ["Date", analysis.created_at.strftime("%Y-%m-%d %H:%M UTC")],
    ]
    info_table = Table(info_data, colWidths=[120, 360])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#1a1a2e")),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("BACKGROUND", (1, 0), (1, -1), colors.HexColor("#f0f0f5")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 16))

    # Summary
    if analysis.summary:
        elements.append(Paragraph("<b>Summary</b>", styles["Heading2"]))
        elements.append(Paragraph(analysis.summary, styles["Normal"]))
        elements.append(Spacer(1, 12))

    # Vulnerabilities
    if analysis.vulnerabilities:
        elements.append(Paragraph("<b>Vulnerabilities Found</b>", styles["Heading2"]))
        elements.append(Spacer(1, 6))

        severity_colors = {
            "critical": colors.HexColor("#dc2626"),
            "high": colors.HexColor("#ea580c"),
            "medium": colors.HexColor("#ca8a04"),
            "low": colors.HexColor("#16a34a"),
            "info": colors.HexColor("#2563eb"),
        }

        for i, v in enumerate(analysis.vulnerabilities, 1):
            sev_color = severity_colors.get(v.severity, colors.grey)
            elements.append(Paragraph(
                f"<b>{i}. {v.title}</b> — <font color='{sev_color}'>{v.severity.upper()}</font>",
                styles["Heading3"]
            ))
            if v.description:
                elements.append(Paragraph(v.description, styles["Normal"]))
            if v.impact:
                elements.append(Paragraph(f"<b>Impact:</b> {v.impact}", styles["Normal"]))
            if v.recommendation:
                elements.append(Paragraph(f"<b>Fix:</b> {v.recommendation}", styles["Normal"]))
            elements.append(Spacer(1, 10))
    else:
        elements.append(Paragraph("No vulnerabilities detected.", styles["Normal"]))

    elements.append(Spacer(1, 20))
    elements.append(Paragraph(
        "<i>Generated by Smart Contract Security Scanner</i>",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=colors.grey)
    ))

    doc.build(elements)
    buffer.seek(0)

    filename = f"report_{contract.name.replace(' ', '_')}_{analysis.id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )


# ──────────────────────────────────────────────
# Chat Endpoints
# ──────────────────────────────────────────────

@app.post("/api/chat")
async def chat(
    request: schemas.ChatRequest,
    db: Session = Depends(get_db)
):
    """Stream a chat response from the AI assistant."""
    # Get or create chat session
    session = None
    if request.session_id:
        session = db.query(models.ChatSession).filter(
            models.ChatSession.id == request.session_id
        ).first()
    
    if not session:
        session = models.ChatSession(analysis_id=request.analysis_id)
        db.add(session)
        db.commit()
        db.refresh(session)
    
    # Save user message
    user_msg = models.ChatMessage(
        session_id=session.id,
        role="user",
        content=request.message
    )
    db.add(user_msg)
    db.commit()
    
    # Build context from analysis if available
    contract_code = None
    vulnerabilities = None
    
    if session.analysis_id:
        analysis = db.query(models.Analysis).filter(
            models.Analysis.id == session.analysis_id
        ).first()
        if analysis:
            contract_code = analysis.contract.source_code
            vulnerabilities = [
                {
                    "title": v.title,
                    "severity": v.severity,
                    "category": v.category,
                    "description": v.description,
                    "impact": v.impact,
                    "recommendation": v.recommendation,
                    "vulnerable_code": v.vulnerable_code,
                    "function_name": v.function_name,
                }
                for v in analysis.vulnerabilities
            ]
    
    # Get conversation history
    history = [
        {"role": m.role, "content": m.content}
        for m in session.messages
        if m.id != user_msg.id  # exclude current message
    ]
    
    # Collect full response for saving
    full_response = []
    
    async def generate():
        async for chunk in chat_service.chat_stream(
            user_message=request.message,
            contract_code=contract_code,
            vulnerabilities=vulnerabilities,
            history=history
        ):
            # Extract content from SSE chunk for saving
            import json as _json
            try:
                line = chunk.strip()
                if line.startswith("data: "):
                    data = _json.loads(line[6:])
                    if data.get("type") == "chunk":
                        full_response.append(data.get("content", ""))
            except Exception:
                pass
            yield chunk
        
        # Save assistant response after streaming completes
        assistant_content = "".join(full_response)
        if assistant_content:
            assistant_msg = models.ChatMessage(
                session_id=session.id,
                role="assistant",
                content=assistant_content
            )
            db_session = SessionLocal()
            try:
                db_session.add(assistant_msg)
                db_session.commit()
            except Exception:
                db_session.rollback()
            finally:
                db_session.close()
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Session-Id": str(session.id),
        }
    )


@app.get("/api/chat/history/{analysis_id}", response_model=list[schemas.ChatHistoryResponse])
async def get_chat_history(analysis_id: int, db: Session = Depends(get_db)):
    """Get chat history for an analysis."""
    sessions = db.query(models.ChatSession).filter(
        models.ChatSession.analysis_id == analysis_id
    ).order_by(models.ChatSession.created_at.desc()).all()
    
    return [
        {
            "session_id": s.id,
            "analysis_id": s.analysis_id,
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat()
                }
                for m in s.messages
            ],
            "created_at": s.created_at.isoformat()
        }
        for s in sessions
    ]


def _calculate_overall_risk(score: int) -> str:
    """Calculate overall risk level from score."""
    if score >= 70:
        return "critical"
    elif score >= 50:
        return "high"
    elif score >= 30:
        return "medium"
    elif score > 0:
        return "low"
    return "info"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)