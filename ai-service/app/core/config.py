from functools import lru_cache
from os import getenv
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field


def _load_env_files() -> None:
    ai_service_dir = Path(__file__).resolve().parents[2]
    repo_dir = ai_service_dir.parent

    load_dotenv(repo_dir / ".env", override=False)
    load_dotenv(ai_service_dir / ".env", override=False)


def _get_positive_float(name: str, default: float) -> float:
    raw_value = getenv(name)
    if raw_value is None or raw_value.strip() == "":
        return default

    value = float(raw_value)
    if value < 0:
        raise ValueError(f"{name} must be greater than or equal to 0")
    return value


class Settings(BaseModel):
    model_config = ConfigDict(frozen=True)

    service_name: str = "ai-service"
    service_version: str = "1.0.0"
    aws_region: str = Field(default="ap-southeast-1")
    request_timeout_seconds: float = Field(default=30, ge=0)
    crawl_delay_seconds: float = Field(default=1, ge=0)
    log_level: str = Field(default="INFO")


@lru_cache
def get_settings() -> Settings:
    _load_env_files()
    return Settings(
        aws_region=getenv("AWS_REGION", "ap-southeast-1"),
        request_timeout_seconds=_get_positive_float("AI_REQUEST_TIMEOUT_SECONDS", 30),
        crawl_delay_seconds=_get_positive_float("AI_CRAWL_DELAY_SECONDS", 1),
        log_level=getenv("AI_LOG_LEVEL", "INFO").upper(),
    )
