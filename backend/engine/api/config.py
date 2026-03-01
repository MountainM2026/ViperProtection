from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "Viper Protection API"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str

    # Digital Ocean Spaces
    DO_SPACES_KEY: str
    DO_SPACES_SECRET: str
    DO_SPACES_BUCKET: str
    DO_SPACES_REGION: str
    DO_SPACES_ENDPOINT: str

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    class Config:
        case_sensitive = True
        env_file = Path(__file__).resolve().parent.parent.parent / ".env"

settings = Settings()