from fastapi import FastAPI

from app.core.config import get_settings
from app.schemas.common import HealthResponse
from app.api.router import api_router

settings = get_settings()

# Khởi tạo ứng dụng FastAPI
app = FastAPI(
    title="AI & Data Pipeline API",
    description="Microservice xử lý cào dữ liệu và tính điểm Matching CV-JD",
    version=settings.service_version,
)

app.include_router(api_router, prefix="/api")


# Tạo một API endpoint cơ bản để test server
@app.get("/", response_model=HealthResponse)
@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        service=settings.service_name,
        version=settings.service_version,
    )
