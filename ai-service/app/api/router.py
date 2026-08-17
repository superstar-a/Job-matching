from fastapi import APIRouter
from app.api.endpoints import matching, nlp, scrape

api_router = APIRouter()
api_router.include_router(scrape.router, tags=["Scraping"])
api_router.include_router(nlp.router, tags=["NLP"])
api_router.include_router(matching.router, tags=["Matching"])
