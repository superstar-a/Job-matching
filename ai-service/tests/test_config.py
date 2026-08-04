from app.core.config import get_settings


def test_settings_reads_ai_service_environment(monkeypatch):
    monkeypatch.setenv("AWS_REGION", "us-east-1")
    monkeypatch.setenv("AI_REQUEST_TIMEOUT_SECONDS", "45")
    monkeypatch.setenv("AI_CRAWL_DELAY_SECONDS", "2.5")
    monkeypatch.setenv("AI_LOG_LEVEL", "debug")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.aws_region == "us-east-1"
    assert settings.request_timeout_seconds == 45
    assert settings.crawl_delay_seconds == 2.5
    assert settings.log_level == "DEBUG"

    get_settings.cache_clear()
