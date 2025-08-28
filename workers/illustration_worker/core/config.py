from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/storyboard"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # NATS
    nats_url: str = "nats://localhost:4222"
    
    # MinIO/S3
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "storyboard-frames"
    minio_secure: bool = False
    
    # API
    api_base_url: str = "http://localhost:3001"
    
    # AI/ML Settings
    model_path: str = "/models/stable-diffusion"
    device: str = "cuda"  # or "cpu"
    batch_size: int = 1
    max_retries: int = 3
    
    # Style presets
    default_style: str = "storyboard"
    available_styles: list = ["sketch", "storyboard", "concept", "realistic"]
    
    # Environment
    environment: str = "development"
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
