"""
API Routes Package.

This file imports all route modules so they can be
easily imported and registered in main.py.
"""

from app.api.routes import analyze
from app.api.routes import contracts
from app.api.routes import reports
from app.api.routes import stats
from app.api.routes import health

__all__ = [
    "analyze",
    "contracts",
    "reports",
    "stats",
    "health",
]