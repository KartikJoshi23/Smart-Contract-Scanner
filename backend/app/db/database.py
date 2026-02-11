from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings


# Create the database engine
# This is the "connection" to our database
engine = create_engine(
    settings.database_url,
    # SQLite requires this setting for multi-threading
    connect_args={"check_same_thread": False}
)

# Session factory
# A "session" is like a conversation with the database
# We create one for each request, then close it
SessionLocal = sessionmaker(
    autocommit=False,  # We control when to save
    autoflush=False,   # We control when to sync
    bind=engine        # Connect to our engine
)

# Base class for all our database models
# Every table we create will inherit from this
Base = declarative_base()


def get_db():
    """
    Dependency that provides a database session.
    
    Usage in FastAPI:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            # use db here
    
    The 'yield' makes this a generator:
    - Code before yield: runs before the request
    - Code after yield: runs after the request (cleanup)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Create all database tables.
    
    Called once when the app starts.
    If tables already exist, this does nothing (safe to call multiple times).
    """
    Base.metadata.create_all(bind=engine)