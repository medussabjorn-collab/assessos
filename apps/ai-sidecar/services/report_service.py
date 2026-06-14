import logging
import uuid
from typing import Dict, List

from services.ai_service import AIService
from services.db_service import DatabaseService

logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self, db_service: DatabaseService, ai_service: AIService):
        self.db = db_service
        self.ai = ai_service

    async def generate_report(
        self,
        session_id: str,
        tenant_id: str,
        user_id: str,
        answers: List[Dict],
        config: Dict,
    ) -> str:
        """
        Full report generation pipeline:
        1. Score answers using AI
        2. Generate narrative
        3. Calculate benchmark percentile
        4. Create coaching plan
        5. Save to database
        """
        try:
            logger.info(f"Starting report generation for session {session_id}")

            # Extract dimensions from config
            dimensions = [d["name"] for d in config.get("dimensions", [])]
            dimension_descriptions = {
                d["name"]: d["description"]
                for d in config.get("dimensions", [])
            }

            # Step 1: Score answers
            logger.info("Scoring answers...")
            dimension_scores = await self.ai.score_answers(answers, dimensions)

            # Step 2: Generate narrative
            logger.info("Generating narrative...")
            narrative = await self.ai.generate_narrative(
                dimension_scores, dimension_descriptions
            )

            # Step 3: Calculate benchmark percentile (placeholder)
            logger.info("Calculating benchmark...")
            benchmark_percentile = await self._calculate_benchmark(
                dimension_scores, tenant_id, config.get("benchmark_group")
            )

            # Step 4: Create coaching plan
            logger.info("Creating coaching plan...")
            coaching_plan = await self.ai.generate_coaching_plan(
                dimension_scores, dimension_descriptions
            )

            # Step 5: Save report
            logger.info("Saving report to database...")
            report_id = await self.db.save_ai_report(
                session_id=session_id,
                tenant_id=tenant_id,
                user_id=user_id,
                dimension_scores=dimension_scores,
                narrative=narrative,
                benchmark_percentile=benchmark_percentile,
                coaching_plan=coaching_plan,
            )

            logger.info(f"Report {report_id} generated successfully")
            return report_id

        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}", exc_info=True)
            raise

    async def get_report(self, report_id: str, tenant_id: str) -> Dict:
        """Retrieve generated report."""
        # TODO: Query database for report details
        return {
            "report_id": report_id,
            "status": "ready",
            "message": "Report retrieved",
        }

    async def _calculate_benchmark(
        self, scores: Dict, tenant_id: str, benchmark_group: str
    ) -> int:
        """
        Calculate benchmark percentile.
        In Phase 4, this will query aggregate scores from all orgs in the benchmark group.
        For now, return a mock percentile.
        """
        avg_score = sum(scores.values()) / len(scores) if scores else 0
        # Mock: position in percentile based on average score
        percentile = min(100, max(0, int(avg_score * 20)))
        return percentile
