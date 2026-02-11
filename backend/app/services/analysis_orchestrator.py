"""
Analysis Orchestrator Service.

This service coordinates the entire analysis process:
1. Receive contract code
2. Call AI for detection
3. Call AI for explanations
4. Save results to database
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.db import models
from app.services.ai_analyzer import ai_analyzer
from app.core.exceptions import AnalysisError


class AnalysisOrchestrator:
    """
    Coordinates the full vulnerability analysis process.
    """
    
    async def analyze_contract(
        self,
        db: Session,
        analysis_id: str,
        contract_code: str
    ) -> models.Analysis:
        """
        Run full analysis on a contract.
        
        Args:
            db: Database session
            analysis_id: ID of the analysis record
            contract_code: Solidity source code
            
        Returns:
            Updated Analysis model with results
        """
        analysis = db.query(models.Analysis).filter(
            models.Analysis.id == analysis_id
        ).first()
        
        if not analysis:
            raise AnalysisError(f"Analysis {analysis_id} not found")
        
        start_time = datetime.utcnow()
        
        try:
            analysis.status = models.AnalysisStatus.PROCESSING
            db.commit()
            
            detection_result = await ai_analyzer.detect_vulnerabilities(contract_code)
            
            if "error" in detection_result:
                raise AnalysisError(
                    "Failed to parse AI detection response",
                    details=detection_result.get("raw", "")
                )
            
            vulnerabilities = detection_result.get("vulnerabilities", [])
            
            for vuln_data in vulnerabilities:
                explanation = await ai_analyzer.explain_vulnerability(
                    vuln_type=vuln_data.get("type", "other"),
                    severity=vuln_data.get("severity", "medium"),
                    function_name=vuln_data.get("function_name", ""),
                    vulnerable_code=vuln_data.get("vulnerable_code", ""),
                    brief_reason=vuln_data.get("brief_reason", ""),
                    contract_code=contract_code
                )
                
                vuln_type = vuln_data.get("type", "other").lower()
                if vuln_type not in ["reentrancy", "integer_overflow", "access_control", "unchecked_call", "frontrunning"]:
                    vuln_type = "other"
                
                severity = vuln_data.get("severity", "medium").lower()
                if severity not in ["critical", "high", "medium", "low", "info"]:
                    severity = "medium"
                
                confidence = vuln_data.get("confidence", "medium").lower()
                if confidence not in ["high", "medium", "low"]:
                    confidence = "medium"
                
                vulnerability = models.Vulnerability(
                    analysis_id=analysis_id,
                    type=vuln_type,
                    severity=severity,
                    confidence=confidence,
                    line_start=vuln_data.get("line_start"),
                    line_end=vuln_data.get("line_end"),
                    function_name=vuln_data.get("function_name"),
                    code_snippet=vuln_data.get("vulnerable_code"),
                    description=explanation.get("description", vuln_data.get("brief_reason", "")),
                    impact=explanation.get("impact"),
                    recommendation=explanation.get("recommendation"),
                    fixed_code=explanation.get("fixed_code")
                )
                db.add(vulnerability)
            
            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            highest_severity = self._get_highest_severity(vulnerabilities)
            risk_score = self._calculate_risk_score(vulnerabilities)
            
            analysis.status = models.AnalysisStatus.COMPLETED
            analysis.overall_risk = highest_severity
            analysis.risk_score = risk_score
            analysis.summary = detection_result.get("summary", f"Found {len(vulnerabilities)} potential vulnerabilities")
            analysis.scan_duration_ms = duration_ms
            analysis.completed_at = end_time
            analysis.total_lines = len(contract_code.split("\n"))
            analysis.functions_analyzed = contract_code.count("function ")
            
            db.commit()
            db.refresh(analysis)
            
            return analysis
            
        except AnalysisError:
            raise
        except Exception as e:
            analysis.status = models.AnalysisStatus.FAILED
            analysis.error_message = str(e)
            db.commit()
            raise AnalysisError(f"Analysis failed: {str(e)}")
    
    def _get_highest_severity(self, vulnerabilities: list) -> Optional[str]:
        """Get the highest severity from a list of vulnerabilities."""
        if not vulnerabilities:
            return "info"
        
        severity_order = ["critical", "high", "medium", "low", "info"]
        
        for severity in severity_order:
            for vuln in vulnerabilities:
                if vuln.get("severity", "").lower() == severity:
                    return severity
        
        return "info"
    
    def _calculate_risk_score(self, vulnerabilities: list) -> int:
        """Calculate overall risk score (0-100)."""
        if not vulnerabilities:
            return 0
        
        severity_scores = {
            "critical": 40,
            "high": 25,
            "medium": 15,
            "low": 5,
            "info": 1
        }
        
        total_score = 0
        for vuln in vulnerabilities:
            severity = vuln.get("severity", "medium").lower()
            total_score += severity_scores.get(severity, 10)
        
        return min(100, total_score)


analysis_orchestrator = AnalysisOrchestrator()