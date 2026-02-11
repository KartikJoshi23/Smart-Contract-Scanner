"""
Shared dependencies for API routes.

Dependencies are reusable functions that FastAPI
injects into route handlers automatically.
"""

from typing import Generator
from sqlalchemy.orm import Session
from app.db.database import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    
    Usage:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            # db is available here
            items = db.query(Item).all()
            return items
    
    The session is automatically closed after the request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()