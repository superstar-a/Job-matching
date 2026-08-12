import json
import time
from datetime import datetime
from typing import Any, Iterable, Optional
from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import get_settings
from app.schemas.jd import JDResponse
from app.services.deduplicator import build_job_fingerprint, deduplicator
from app.utils.html_cleaner import clean_html


LINKEDIN_POLICY_MESSAGE = (
    "LinkedIn is reserved for P2 or allowed API/user-provided data, "
    "so this MVP scraper does not fetch it."
)


class BaseScraper:
    def __init__(self):
        settings = get_settings()
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/91.0.4472.124 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        }
        self.timeout = settings.request_timeout_seconds
        self.crawl_delay = settings.crawl_delay_seconds


class StaticScraper(BaseScraper):
    """Crawler for pages where relevant HTML is available without JS rendering."""

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def fetch_html(self, url: str) -> str:
        response = requests.get(url, headers=self.headers, timeout=self.timeout)
        response.raise_for_status()
        return response.text

    def scrape(self, url: str) -> JDResponse:
        url = str(url)
        source = detect_source(url)

        if is_blocked_source(url):
            return JDResponse(
                source=source,
                source_url=url,
                description_text=LINKEDIN_POLICY_MESSAGE,
                crawl_status="blocked",
            )

        if deduplicator.is_duplicate(url=url):
            return JDResponse(
                source=source,
                source_url=url,
                description_text="URL has already been scraped; skipped to avoid duplicates.",
                crawl_status="skipped",
            )

        try:
            if self.crawl_delay > 0:
                time.sleep(self.crawl_delay)

            raw_html = self.fetch_html(url)
            soup = BeautifulSoup(raw_html, "html.parser")
            job_data = extract_jobposting_json_ld(soup) or {}

            title = (
                get_string(job_data.get("title"))
                or first_text(soup, ["h1", "[class*='title']", "title"])
                or "Unknown Title"
            )
            company_name = (
                extract_company_name(job_data)
                or first_text(soup, ["[class*='company']", "[data-testid*='company']"])
            )
            location = (
                extract_location(job_data)
                or first_text(soup, ["[class*='location']", "[data-testid*='location']"])
            )
            external_id = extract_external_id(url, job_data)
            requirements_text = first_text(
                soup,
                [
                    "#requirements",
                    "[class*='requirements']",
                    "[class*='requirement']",
                    "[class*='qualifications']",
                ],
            )
            benefits_text = first_text(
                soup,
                ["#benefits", "[class*='benefits']", "[class*='benefit']"],
            )
            description_text = (
                first_text(
                    soup,
                    [
                        "#description",
                        "[class*='job-description']",
                        "[class*='description']",
                        "[data-testid*='description']",
                    ],
                )
                or clean_html(str(soup.body))
                if soup.body
                else clean_html(raw_html)
            )
            job_type = extract_job_type(job_data)
            fingerprint = build_job_fingerprint(title, company_name, location)

            if deduplicator.is_duplicate(
                url=url,
                external_id=external_id,
                fingerprint=fingerprint,
            ):
                return JDResponse(
                    source=source,
                    source_url=url,
                    external_id=external_id,
                    title=title,
                    company_name=company_name,
                    location=location,
                    description_text="Job has already been scraped; skipped to avoid duplicates.",
                    crawl_status="skipped",
                )

            result = JDResponse(
                source=source,
                source_url=url,
                external_id=external_id,
                title=title,
                company_name=company_name,
                location=location,
                job_type=job_type,
                description_text=description_text,
                requirements_text=requirements_text,
                benefits_text=benefits_text,
                raw_html=truncate_raw_html(raw_html),
                crawl_status="success",
            )

            deduplicator.mark_as_scraped(
                url,
                external_id=external_id,
                fingerprint=fingerprint,
            )
            return result

        except Exception as exc:
            return JDResponse(
                source=source,
                source_url=url,
                description_text=f"Error scraping: {exc}",
                crawl_status="failed",
                crawled_at=datetime.utcnow(),
            )


def get_scraper(url: str) -> BaseScraper:
    return StaticScraper()


def detect_source(url: str) -> str:
    host = normalized_host(url)
    if host.endswith("itviec.com"):
        return "ITviec"
    if host.endswith("vietnamworks.com"):
        return "VietnamWorks"
    if host.endswith("linkedin.com"):
        return "LinkedIn"
    return host or "unknown"


def is_blocked_source(url: str) -> bool:
    return normalized_host(url).endswith("linkedin.com")


def normalized_host(url: str) -> str:
    host = urlparse(url).netloc.lower().split("@")[-1].split(":")[0]
    if host.startswith("www."):
        host = host[4:]
    return host


def extract_external_id(url: str, job_data: dict[str, Any]) -> Optional[str]:
    identifier = job_data.get("identifier")
    if isinstance(identifier, dict):
        value = get_string(identifier.get("value")) or get_string(identifier.get("name"))
        if value:
            return value
    if isinstance(identifier, str) and identifier.strip():
        return identifier.strip()

    path = urlparse(url).path.rstrip("/")
    if not path:
        return None
    slug = path.split("/")[-1].strip()
    return slug or None


def extract_jobposting_json_ld(soup: BeautifulSoup) -> Optional[dict[str, Any]]:
    for script in soup.find_all("script", attrs={"type": "application/ld+json"}):
        raw_json = script.string or script.get_text()
        if not raw_json or not raw_json.strip():
            continue
        try:
            payload = json.loads(raw_json)
        except json.JSONDecodeError:
            continue

        for candidate in iter_json_objects(payload):
            candidate_type = candidate.get("@type")
            if is_jobposting_type(candidate_type):
                return candidate
    return None


def iter_json_objects(payload: Any) -> Iterable[dict[str, Any]]:
    if isinstance(payload, list):
        for item in payload:
            yield from iter_json_objects(item)
    elif isinstance(payload, dict):
        yield payload
        for key in ("@graph", "itemListElement"):
            if key in payload:
                yield from iter_json_objects(payload[key])


def is_jobposting_type(candidate_type: Any) -> bool:
    if isinstance(candidate_type, str):
        return candidate_type.lower() == "jobposting"
    if isinstance(candidate_type, list):
        return any(is_jobposting_type(item) for item in candidate_type)
    return False


def extract_company_name(job_data: dict[str, Any]) -> Optional[str]:
    organization = job_data.get("hiringOrganization") or job_data.get("organization")
    if isinstance(organization, dict):
        return get_string(organization.get("name"))
    return get_string(organization)


def extract_location(job_data: dict[str, Any]) -> Optional[str]:
    location = job_data.get("jobLocation")
    if isinstance(location, list):
        location = location[0] if location else None
    if isinstance(location, dict):
        address = location.get("address") or location
        if isinstance(address, dict):
            parts = [
                get_string(address.get("addressLocality")),
                get_string(address.get("addressRegion")),
                get_string(address.get("addressCountry")),
            ]
            return ", ".join(part for part in parts if part) or None
        return get_string(address)
    return get_string(location)


def extract_job_type(job_data: dict[str, Any]) -> Optional[str]:
    employment_type = job_data.get("employmentType")
    if isinstance(employment_type, list):
        values = [get_string(item) for item in employment_type]
        return ", ".join(value for value in values if value) or None
    return get_string(employment_type)


def first_text(soup: BeautifulSoup, selectors: list[str]) -> Optional[str]:
    for selector in selectors:
        tag = soup.select_one(selector)
        if not tag:
            continue
        text = clean_html(str(tag))
        if text:
            return text
    return None


def get_string(value: Any) -> Optional[str]:
    if value is None:
        return None
    text = str(value).strip()
    return text or None


def truncate_raw_html(raw_html: str, limit: int = 500) -> str:
    if len(raw_html) <= limit:
        return raw_html
    return raw_html[:limit] + "..."
