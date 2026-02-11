from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App Info
    app_name: str = "Smart Contract Security Scanner"
    app_version: str = "1.0.0"
    debug: bool = True
    
    # Database
    database_url: str = "sqlite:///./scanner.db"
    
    # CORS (which websites can access our API)
    cors_origins: List[str] = [
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative port
    ]
    
    # Ollama (AI)
    ollama_host: str = "http://localhost:11434"
    detection_model: str = "deepseek-coder-v2:latest"
    explanation_model: str = "llama3.1:8b"
    
    # Alchemy (Blockchain RPC) - optional for now
    alchemy_api_key: str = ""
    
    # Foundry
    foundry_timeout: int = 60  # seconds
    
    # Rate Limiting
    rate_limit_per_minute: int = 10
    
    # File Limits
    max_code_size_kb: int = 500
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    
    @lru_cache means this function runs once,
    then returns the same result every time.
    This is efficient - we don't reload settings repeatedly.
    """
    return Settings()


# Create a settings instance we can import anywhere
settings = get_settings()