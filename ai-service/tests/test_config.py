import pytest

from app.core import config


AI_ENV_VARS = (
    "AWS_REGION",
    "AI_REQUEST_TIMEOUT_SECONDS",
    "AI_CRAWL_DELAY_SECONDS",
    "AI_LOG_LEVEL",
)


@pytest.fixture(autouse=True)
def clear_settings_cache():
    config.get_settings.cache_clear()
    yield
    config.get_settings.cache_clear()


@pytest.fixture
def ignore_env_files(monkeypatch):
    monkeypatch.setattr(config, "load_dotenv", lambda *args, **kwargs: None)


def test_settings_reads_ai_service_environment(monkeypatch, ignore_env_files):
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("AI_REQUEST_TIMEOUT_SECONDS", "45")
    monkeypatch.setenv("AI_CRAWL_DELAY_SECONDS", "2.5")
    monkeypatch.setenv("AI_LOG_LEVEL", "debug")

    settings = config.get_settings()

    assert settings.aws_region == "us-east-1"
    assert settings.request_timeout_seconds == 45
    assert settings.crawl_delay_seconds == 2.5
    assert settings.log_level == "DEBUG"


def test_settings_uses_defaults_without_ai_environment(monkeypatch, ignore_env_files):
    for name in AI_ENV_VARS:
        monkeypatch.delenv(name, raising=False)

    settings = config.get_settings()

    assert settings.aws_region == "ap-southeast-1"
    assert settings.request_timeout_seconds == 30
    assert settings.crawl_delay_seconds == 1
    assert settings.log_level == "INFO"


def test_settings_treats_empty_numeric_environment_as_default(
    monkeypatch, ignore_env_files
):
    monkeypatch.setenv("AI_REQUEST_TIMEOUT_SECONDS", "")
    monkeypatch.setenv("AI_CRAWL_DELAY_SECONDS", "   ")

    settings = config.get_settings()

    assert settings.request_timeout_seconds == 30
    assert settings.crawl_delay_seconds == 1


def test_settings_rejects_negative_numeric_environment(monkeypatch, ignore_env_files):
    monkeypatch.setenv("AI_REQUEST_TIMEOUT_SECONDS", "-1")

    with pytest.raises(ValueError, match="AI_REQUEST_TIMEOUT_SECONDS"):
        config.get_settings()
