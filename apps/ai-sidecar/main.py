from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
import logging
from contextlib import asynccontextmanager

from config import Settings
from services.ai_service import AIService
from services.report_service import ReportService
from services.db_service import DatabaseService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = Settings()
db_service = DatabaseService(settings)
ai_service = AIService(settings)
report_service = ReportService(db_service, ai_service)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI sidecar...")
    yield
    logger.info("Shutting down AI sidecar...")


app = FastAPI(
    title="AssessOS AI Sidecar",
    description="AI report generation engine for leadership assessments",
    version="1.0.0",
    lifespan=lifespan,
)


class GenerateReportRequest(BaseModel):
    session_id: str
    tenant_id: str
    user_id: str
    answers: list[dict]
    config: dict


class ReportResponse(BaseModel):
    report_id: str
    status: str
    message: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/reports/generate")
async def generate_report(request: GenerateReportRequest) -> ReportResponse:
    """
    Generate AI report for assessment session.
    Scores answers, generates narrative, benchmarks against group, creates coaching plan.
    """
    try:
        report_id = await report_service.generate_report(
            session_id=request.session_id,
            tenant_id=request.tenant_id,
            user_id=request.user_id,
            answers=request.answers,
            config=request.config,
        )

        return ReportResponse(
            report_id=report_id,
            status="processing",
            message="Report generation started",
        )

    except Exception as e:
        logger.error(f"Report generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/reports/{report_id}")
async def get_report(report_id: str, tenant_id: str):
    """
    Retrieve generated report.
    """
    try:
        report = await report_service.get_report(report_id, tenant_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    except Exception as e:
        logger.error(f"Failed to retrieve report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
