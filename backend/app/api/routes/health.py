"""
Health check endpoints.

These endpoints help us verify the application
and its dependencies are working correctly.
"""

from fastapi import APIRouter
import httpx
import shutil

from app.core.config import settings
from app.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check health of all services.
    
    Returns status of:
    - Database connection
    - Ollama (AI) service
    - Foundry installation
    """
    services = {
        "database": "unknown",
        "ollama": "unknown",
        "foundry": "unknown"
    }
    
    # Check Database
    try:
        from app.db.database import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        services["database"] = "connected"
    except Exception as e:
        services["database"] = f"error: {str(e)}"
    
    # Check Ollama
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.ollama_host}/api/tags",
                timeout=5.0
            )
            if response.status_code == 200:
                services["ollama"] = "connected"
            else:
                services["ollama"] = f"error: status {response.status_code}"
    except httpx.TimeoutException:
        services["ollama"] = "timeout"
    except Exception as e:
        services["ollama"] = "disconnected"
    
    # Check Foundry
    if shutil.which("forge"):
        services["foundry"] = "installed"
    else:
        services["foundry"] = "not_installed"
    
    # Determine overall status
    all_healthy = (
        services["database"] == "connected" and
        services["ollama"] == "connected" and
        services["foundry"] == "installed"
    )
    
    return HealthResponse(
        status="healthy" if all_healthy else "degraded",
        version=settings.app_version,
        services=services
    )


@router.get("/health/ping")
async def ping():
    """
    Simple ping endpoint.
    
    Use this for basic "is the server running?" checks.
    Faster than full health check.
    """
    return {"ping": "pong"}