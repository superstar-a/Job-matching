from fastapi import APIRouter

from app.schemas.jd import JDCreate, JDResponse
from app.services.scraper import get_scraper


router = APIRouter()


@router.post("/scrape-jd", response_model=JDResponse, summary="Scrape JD from URL")
def scrape_jd(payload: JDCreate):
    """Scrape one JD URL and return a normalized JSON response."""

    url = str(payload.url)
    scraper = get_scraper(url)
    return scraper.scrape(url)
