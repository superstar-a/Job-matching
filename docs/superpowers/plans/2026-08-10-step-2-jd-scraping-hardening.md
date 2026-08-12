# Step 2 JD Scraping Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the completed Step 2 JD scraping checklist behave reliably enough for MVP use.

**Architecture:** Keep the current FastAPI + service layout. Add focused unit/API tests around HTML cleaning, scraping, deduplication, and the internal scrape endpoint, then update the existing modules with small helpers for URL policy, static extraction, delay, and duplicate keys.

**Tech Stack:** FastAPI, Pydantic v2, requests, BeautifulSoup, tenacity, sqlite3, pytest, TestClient.

## Global Constraints

- Do not add Selenium or dynamic crawling in this change.
- Do not depend on live job websites in tests.
- Keep AI-service as JSON-returning service; do not add SQL Server writes.
- Keep edits scoped to Step 2 files and tests.
- Use ASCII text in new docs/tests unless existing file content requires otherwise.

---

### Task 1: Scraper Behavior Tests

**Files:**
- Create: `ai-service/tests/test_scraping.py`
- Modify: `ai-service/app/services/scraper.py`
- Modify: `ai-service/app/utils/html_cleaner.py`

**Interfaces:**
- Consumes: `StaticScraper.scrape(url: str) -> JDResponse`, `clean_html(raw_html: str) -> str`.
- Produces: verified behavior for clean HTML, URL policy, crawl delay, and generic JD extraction.

- [ ] **Step 1: Write failing tests**

```python
def test_clean_html_removes_layout_tags_and_decodes_entities():
    html = "<body><nav>Menu</nav><h1>Dev &amp; AI</h1><script>x()</script><p>Hello&nbsp;world</p></body>"
    assert "Menu" not in clean_html(html)
    assert "x()" not in clean_html(html)
    assert "Dev & AI" in clean_html(html)
    assert "Hello world" in clean_html(html)

def test_static_scraper_extracts_generic_jd_fields(monkeypatch, tmp_path):
    html = "<html><body><h1>Backend Developer</h1><section class='company'>Acme</section><section class='location'>Ho Chi Minh</section><section id='requirements'><li>Python</li></section><section id='benefits'><li>Bonus</li></section></body></html>"
    monkeypatch.setattr("app.services.scraper.deduplicator", JobDeduplicator(str(tmp_path / "jobs.db")))
    monkeypatch.setattr("app.services.scraper.time.sleep", lambda seconds: None)
    monkeypatch.setattr(StaticScraper, "fetch_html", lambda self, url: html)
    result = StaticScraper().scrape("https://example.com/jobs/backend-developer-123")
    assert result.crawl_status == "success"
    assert result.title == "Backend Developer"
    assert result.company_name == "Acme"
    assert result.location == "Ho Chi Minh"
    assert result.external_id == "backend-developer-123"
    assert "Python" in result.requirements_text
    assert "Bonus" in result.benefits_text
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_scraping.py -q`
Expected: FAIL because extraction helpers, LinkedIn policy, and delay behavior are missing or incomplete.

- [ ] **Step 3: Implement minimal scraper changes**

Use BeautifulSoup selectors and JSON-LD parsing to populate MVP fields. Add `is_allowed_url`, source detection, `extract_external_id`, `extract_text_by_selectors`, and call `time.sleep(settings.crawl_delay_seconds)` before fetch.

- [ ] **Step 4: Run tests to verify pass**

Run: `python -m pytest tests/test_scraping.py -q`
Expected: PASS.

### Task 2: Deduplication Keys

**Files:**
- Modify: `ai-service/app/services/deduplicator.py`
- Test: `ai-service/tests/test_scraping.py`

**Interfaces:**
- Consumes: `JDResponse`.
- Produces: `build_job_fingerprint(title, company_name, location) -> str | None`, `is_duplicate(url, external_id, fingerprint) -> bool`, `mark_as_scraped(url, external_id, fingerprint) -> None`.

- [ ] **Step 1: Write failing tests**

```python
def test_deduplicator_detects_external_id_and_fingerprint(tmp_path):
    store = JobDeduplicator(str(tmp_path / "jobs.db"))
    fingerprint = build_job_fingerprint("Backend Developer", "Acme", "Ho Chi Minh")
    store.mark_as_scraped("https://example.com/a", external_id="123", fingerprint=fingerprint)
    assert store.is_duplicate("https://example.com/other", external_id="123", fingerprint=None)
    assert store.is_duplicate("https://example.com/new", external_id=None, fingerprint=fingerprint)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python -m pytest tests/test_scraping.py::test_deduplicator_detects_external_id_and_fingerprint -q`
Expected: FAIL because the API does not exist yet.

- [ ] **Step 3: Implement dedup columns and helper**

Add nullable unique columns for `external_id` and `fingerprint`, migrate existing sqlite table with `ALTER TABLE` guarded by `PRAGMA table_info`, and keep URL compatibility.

- [ ] **Step 4: Run test to verify pass**

Run: `python -m pytest tests/test_scraping.py::test_deduplicator_detects_external_id_and_fingerprint -q`
Expected: PASS.

### Task 3: Endpoint and Batch Behavior

**Files:**
- Modify: `ai-service/app/schemas/jd.py`
- Modify: `ai-service/app/api/endpoints/scrape.py`
- Modify: `ai-service/scripts/batch_scrape.py`
- Test: `ai-service/tests/test_scraping.py`

**Interfaces:**
- Consumes: `JDCreate(url: HttpUrl)`.
- Produces: API rejects invalid URLs, LinkedIn returns a controlled failure response, batch writes only successful records unless configured otherwise.

- [ ] **Step 1: Write failing tests**

```python
def test_scrape_endpoint_rejects_invalid_url():
    response = client.post("/api/scrape-jd", json={"url": "not-a-url"})
    assert response.status_code == 422

def test_batch_should_write_success_records_only(tmp_path):
    assert should_write_result("success", include_non_success=False)
    assert not should_write_result("failed", include_non_success=False)
    assert not should_write_result("skipped", include_non_success=False)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `python -m pytest tests/test_scraping.py -q`
Expected: FAIL for missing `HttpUrl` validation or batch helper.

- [ ] **Step 3: Implement endpoint and batch changes**

Use Pydantic `HttpUrl`, convert to string in endpoint/script, remove unused `HTTPException`, and add `should_write_result` in batch script.

- [ ] **Step 4: Run full AI-service tests**

Run: `python -m pytest`
Expected: all tests pass.

### Task 4: Docs and TODO Alignment

**Files:**
- Modify: `ai-service/docs/TESTING_GUIDE.md`
- Modify: `ai-service/TODO.md`

**Interfaces:**
- Consumes: verified test command output.
- Produces: docs describing scraper tests and TODO checkboxes aligned with actual behavior.

- [ ] **Step 1: Update testing guide**

Add the scraper test coverage to the "Hien tai test dang kiem tra" section.

- [ ] **Step 2: Update TODO status if needed**

Keep completed boxes only where tests and implementation now support the claim. Leave Selenium unchecked.

- [ ] **Step 3: Run final verification**

Run: `python -m pytest`
Expected: all tests pass.

