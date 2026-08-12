from fastapi import APIRouter
from app.api.endpoints import scrape

api_router = APIRouter()
api_router.include_router(scrape.router, tags=["Scraping"])
