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
    minio_bucket: str = "storyboard-exports"
    minio_secure: bool = False

    # API
    api_base_url: str = "http://localhost:3001"

    # Export settings
    temp_dir: str = "/tmp/exports"
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    font_path: str = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    
    # PDF settings
    pdf_page_size: str = "A4"
    pdf_margin: int = 20
    pdf_quality: str = "high"
    
    # Video settings
    video_codec: str = "libx264"
    video_bitrate: str = "2M"
    audio_codec: str = "aac"
    audio_bitrate: str = "128k"
    
    # CSV settings
    csv_delimiter: str = ","
    csv_encoding: str = "utf-8"
    
    # Environment
    environment: str = "development"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
