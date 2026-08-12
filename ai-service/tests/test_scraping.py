from fastapi.testclient import TestClient

from app.services import deduplicator as deduplicator_module
from app.services.deduplicator import JobDeduplicator
from app.services.scraper import StaticScraper
from app.utils.html_cleaner import clean_html
from main import app
from scripts import batch_scrape


client = TestClient(app)


def test_clean_html_removes_layout_tags_and_decodes_entities():
    html = """
    <body>
      <header>Header</header>
      <nav>Menu</nav>
      <h1>Dev &amp; AI</h1>
      <script>alert("x")</script>
      <style>body { color: red; }</style>
      <p>Hello&nbsp;world</p>
      <footer>Footer</footer>
    </body>
    """

    cleaned = clean_html(html)

    assert "Header" not in cleaned
    assert "Menu" not in cleaned
    assert "Footer" not in cleaned
    assert "alert" not in cleaned
    assert "Dev & AI" in cleaned
    assert "Hello world" in cleaned


def test_static_scraper_extracts_generic_jd_fields(monkeypatch, tmp_path):
    html = """
    <html>
      <head>
        <script type="application/ld+json">
        {
          "@type": "JobPosting",
          "title": "Backend Developer",
          "hiringOrganization": {"name": "Acme"},
          "jobLocation": {"address": {"addressLocality": "Ho Chi Minh"}},
          "employmentType": "FULL_TIME"
        }
        </script>
      </head>
      <body>
        <h1>Backend Developer</h1>
        <section id="description"><p>Build APIs with FastAPI.</p></section>
        <section id="requirements"><ul><li>Python</li><li>SQL</li></ul></section>
        <section id="benefits"><ul><li>Bonus</li></ul></section>
      </body>
    </html>
    """
    store = JobDeduplicator(str(tmp_path / "jobs.db"))
    monkeypatch.setattr("app.services.scraper.deduplicator", store)
    monkeypatch.setattr("app.services.scraper.time.sleep", lambda seconds: None)
    monkeypatch.setattr(StaticScraper, "fetch_html", lambda self, url: html)

    result = StaticScraper().scrape("https://example.com/jobs/backend-developer-123")

    assert result.crawl_status == "success"
    assert result.source == "example.com"
    assert result.source_url == "https://example.com/jobs/backend-developer-123"
    assert result.external_id == "backend-developer-123"
    assert result.title == "Backend Developer"
    assert result.company_name == "Acme"
    assert result.location == "Ho Chi Minh"
    assert result.job_type == "FULL_TIME"
    assert "Build APIs" in result.description_text
    assert "Python" in result.requirements_text
    assert "Bonus" in result.benefits_text


def test_static_scraper_blocks_linkedin_without_fetching(monkeypatch, tmp_path):
    store = JobDeduplicator(str(tmp_path / "jobs.db"))
    monkeypatch.setattr("app.services.scraper.deduplicator", store)

    def fail_fetch(self, url):
        raise AssertionError("LinkedIn should not be fetched")

    monkeypatch.setattr(StaticScraper, "fetch_html", fail_fetch)

    result = StaticScraper().scrape("https://www.linkedin.com/jobs/view/123")

    assert result.crawl_status == "blocked"
    assert "LinkedIn" in result.description_text


def test_deduplicator_detects_external_id_and_fingerprint(tmp_path):
    store = JobDeduplicator(str(tmp_path / "jobs.db"))
    fingerprint = deduplicator_module.build_job_fingerprint(
        "Backend Developer", "Acme", "Ho Chi Minh"
    )

    store.mark_as_scraped(
        "https://example.com/jobs/backend-developer-123",
        external_id="backend-developer-123",
        fingerprint=fingerprint,
    )

    assert store.is_duplicate(
        "https://example.com/jobs/other",
        external_id="backend-developer-123",
        fingerprint=None,
    )
    assert store.is_duplicate(
        "https://example.com/jobs/new",
        external_id=None,
        fingerprint=fingerprint,
    )


def test_scrape_endpoint_rejects_invalid_url():
    response = client.post("/api/scrape-jd", json={"url": "not-a-url"})

    assert response.status_code == 422


def test_batch_should_write_success_records_only():
    assert batch_scrape.should_write_result("success", include_non_success=False)
    assert not batch_scrape.should_write_result("failed", include_non_success=False)
    assert not batch_scrape.should_write_result("skipped", include_non_success=False)
    assert batch_scrape.should_write_result("failed", include_non_success=True)
