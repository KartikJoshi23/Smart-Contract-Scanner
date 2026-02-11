"""
Smart Contract Security Scanner - Main Application

This is the entry point of our FastAPI application.
It sets up the app, middleware, routes, and error handlers.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.exceptions import (
    ScannerException,
    ValidationError,
    AnalysisError,
    AIServiceError,
    FoundryError,
    ContractNotFoundError,
    RateLimitError,
)
from app.db.database import init_db
from app.api.routes import analyze, contracts, reports, stats, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events handler.
    
    Code before 'yield' runs on startup.
    Code after 'yield' runs on shutdown.
    """
    # === STARTUP ===
    print("=" * 50)
    print(f"🚀 Starting {settings.app_name}...")
    print(f"📦 Version: {settings.app_version}")
    print(f"🔧 Debug Mode: {settings.debug}")
    print("=" * 50)
    
    # Initialize database tables
    print("📊 Initializing database...")
    init_db()
    print("✅ Database ready!")
    
    print(f"🤖 AI Host: {settings.ollama_host}")
    print(f"🔍 Detection Model: {settings.detection_model}")
    print(f"💬 Explanation Model: {settings.explanation_model}")
    print("=" * 50)
    print("✅ Application started successfully!")
    print("📚 API Docs: http://localhost:8000/docs")
    print("=" * 50)
    
    yield  # App runs here
    
    # === SHUTDOWN ===
    print("=" * 50)
    print("👋 Shutting down...")
    print("✅ Cleanup complete!")
    print("=" * 50)


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="""
    ## AI-Powered Smart Contract Vulnerability Detection
    
    This API scans Solidity smart contracts for security vulnerabilities using:
    - **DeepSeek Coder V2** for vulnerability detection
    - **Llama 3.1** for human-readable explanations
    - **Foundry** for verification through attack simulations
    
    ### Features
    - 🔍 Analyze contracts by source code or blockchain address
    - 🎯 Detect common vulnerabilities (reentrancy, overflow, access control, etc.)
    - 📝 Get detailed explanations and fix recommendations
    - 📊 Generate comprehensive security reports
    """,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ============ CORS MIDDLEWARE ============
# This allows the frontend to communicate with the backend

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Which websites can access
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


# ============ EXCEPTION HANDLERS ============
# These convert our custom exceptions into proper HTTP responses

@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    """Handle invalid input errors."""
    return JSONResponse(
        status_code=400,
        content={
            "error": "validation_error",
            "message": exc.message,
            "details": exc.details
        }
    )


@app.exception_handler(ContractNotFoundError)
async def not_found_handler(request: Request, exc: ContractNotFoundError):
    """Handle not found errors."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "not_found",
            "message": exc.message
        }
    )


@app.exception_handler(RateLimitError)
async def rate_limit_handler(request: Request, exc: RateLimitError):
    """Handle rate limit exceeded."""
    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": exc.message
        }
    )


@app.exception_handler(AnalysisError)
async def analysis_error_handler(request: Request, exc: AnalysisError):
    """Handle analysis failures."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "analysis_error",
            "message": exc.message,
            "details": exc.details
        }
    )


@app.exception_handler(AIServiceError)
async def ai_error_handler(request: Request, exc: AIServiceError):
    """Handle AI service unavailable."""
    return JSONResponse(
        status_code=503,
        content={
            "error": "ai_service_unavailable",
            "message": "AI service is temporarily unavailable. Please try again later."
        }
    )


@app.exception_handler(FoundryError)
async def foundry_error_handler(request: Request, exc: FoundryError):
    """Handle Foundry execution errors."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "foundry_error",
            "message": "Blockchain simulation failed",
            "details": exc.message
        }
    )


# ============ REGISTER ROUTES ============
# Each router handles a group of related endpoints

app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(contracts.router, prefix="/api", tags=["Contracts"])
app.include_router(reports.router, prefix="/api", tags=["Reports"])
app.include_router(stats.router, prefix="/api", tags=["Statistics"])


# ============ ROOT ENDPOINT ============

@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint.
    
    Returns basic information about the API.
    """
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "running",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "endpoints": {
            "health": "/api/health",
            "analyze": "/api/analyze",
            "contracts": "/api/contracts",
            "reports": "/api/reports",
            "stats": "/api/stats"
        }
    }


@app.get("/api", tags=["Root"])
async def api_root():
    """
    API root endpoint.
    
    Lists all available API endpoints.
    """
    return {
        "message": "Welcome to the Smart Contract Security Scanner API!",
        "version": settings.app_version,
        "endpoints": [
            {"path": "/api/health", "description": "Health check"},
            {"path": "/api/analyze/code", "description": "Analyze contract from code"},
            {"path": "/api/analyze/address", "description": "Analyze contract from address"},
            {"path": "/api/contracts", "description": "List all contracts"},
            {"path": "/api/reports/{id}/json", "description": "Get JSON report"},
            {"path": "/api/stats", "description": "Get statistics"},
        ]
    }