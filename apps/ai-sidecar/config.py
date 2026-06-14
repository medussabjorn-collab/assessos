from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # FastAPI
    app_name: str = "AssessOS AI Sidecar"
    debug: bool = False

    # Database
    database_url: str = "postgresql://assessos_user:assessos_pass@localhost:5432/assessos"

    # Azure OpenAI
    openai_api_key: str
    openai_api_version: str = "2024-02-15-preview"
    openai_api_endpoint: str
    openai_model: str = "gpt-4o"
    openai_deployment_name: str = "gpt-4o"

    # AWS (SQS, S3)
    aws_access_key_id: Optional[str] = None
    aws_secret_access_key: Optional[str] = None
    aws_region: str = "us-east-1"
    sqs_queue_url: Optional[str] = None
    s3_bucket: str = "assessos-reports"

    # Report generation
    report_pdf_width: int = 8500
    report_pdf_height: int = 11000
    benchmark_percentile_count: int = 100

    class Config:
        env_file = ".env"
        case_sensitive = False
