import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import Optional, Dict

from config import Settings

logger = logging.getLogger(__name__)


class DatabaseService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.engine = create_engine(settings.database_url, echo=False)
        self.SessionLocal = sessionmaker(bind=self.engine)

    def get_session(self):
        return self.SessionLocal()

    async def get_assessment_session(
        self, session_id: str, tenant_id: str
    ) -> Optional[Dict]:
        """Fetch assessment session data."""
        with self.get_session() as session:
            result = session.execute(
                text("""
                    SELECT id, user_id, config_id, pillar, status, started_at, submitted_at
                    FROM assessment_sessions
                    WHERE id = :session_id AND tenant_id = :tenant_id
                """),
                {"session_id": session_id, "tenant_id": tenant_id},
            )
            row = result.fetchone()
            return dict(row._mapping) if row else None

    async def save_ai_report(
        self,
        session_id: str,
        tenant_id: str,
        user_id: str,
        dimension_scores: Dict,
        narrative: str,
        benchmark_percentile: int,
        coaching_plan: Dict,
    ) -> str:
        """Save AI report to database."""
        with self.get_session() as session:
            result = session.execute(
                text("""
                    INSERT INTO ai_reports
                    (id, tenant_id, session_id, user_id, dimension_scores, narrative,
                     benchmark_percentile, coaching_plan, status, created_at, updated_at)
                    VALUES (
                        gen_random_uuid()::text,
                        :tenant_id,
                        :session_id,
                        :user_id,
                        :dimension_scores,
                        :narrative,
                        :benchmark_percentile,
                        :coaching_plan,
                        'ready',
                        NOW(),
                        NOW()
                    )
                    RETURNING id
                """),
                {
                    "tenant_id": tenant_id,
                    "session_id": session_id,
                    "user_id": user_id,
                    "dimension_scores": str(dimension_scores),
                    "narrative": narrative,
                    "benchmark_percentile": benchmark_percentile,
                    "coaching_plan": str(coaching_plan),
                },
            )
            session.commit()
            report_id = result.scalar()
            logger.info(f"Saved report {report_id} for session {session_id}")
            return report_id

    async def update_session_status(
        self, session_id: str, status: str
    ) -> None:
        """Update assessment session status."""
        with self.get_session() as session:
            session.execute(
                text("""
                    UPDATE assessment_sessions
                    SET status = :status, updated_at = NOW()
                    WHERE id = :session_id
                """),
                {"session_id": session_id, "status": status},
            )
            session.commit()
