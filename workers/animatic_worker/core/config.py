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
    minio_bucket: str = "storyboard-animatics"
    minio_secure: bool = False

    # API
    api_base_url: str = "http://localhost:3001"

    # Media processing settings
    ffmpeg_path: str = "/usr/bin/ffmpeg"
    temp_dir: str = "/tmp/animatics"
    max_duration: int = 300  # 5 minutes max
    frame_rate: int = 24
    resolution: str = "1920x1080"

    # Audio settings
    sample_rate: int = 44100
    audio_bitrate: str = "128k"
    enable_tts: bool = True
    tts_voice: str = "en-US-Standard-A"

    # Caption settings
    caption_font: str = "Arial"
    caption_size: int = 24
    caption_color: str = "white"
    caption_bg_color: str = "rgba(0,0,0,0.7)"

    # Environment
    environment: str = "development"
    log_level: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
