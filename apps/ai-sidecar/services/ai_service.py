import logging
from openai import AzureOpenAI
from typing import Dict, List
from tenacity import retry, stop_after_attempt, wait_exponential

from config import Settings

logger = logging.getLogger(__name__)


class AIService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = AzureOpenAI(
            api_key=settings.openai_api_key,
            api_version=settings.openai_api_version,
            azure_endpoint=settings.openai_api_endpoint,
        )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def score_answers(
        self, answers: List[Dict], dimensions: List[str]
    ) -> Dict[str, float]:
        """
        Score answers using GPT-4o.
        Returns dimension scores as floats (0-5).
        """
        dimensions_str = ", ".join(dimensions)

        prompt = f"""
        You are an expert leadership assessment scorer.
        Score the following answers on these competency dimensions: {dimensions_str}

        Each dimension should receive a score from 0 to 5, where:
        - 0: Not demonstrated
        - 1: Minimal capability
        - 2: Below expectations
        - 3: Meets expectations
        - 4: Exceeds expectations
        - 5: Exceptional / Best-in-class

        Answers:
        {self._format_answers_for_prompt(answers)}

        Return ONLY a JSON object with dimension names as keys and scores as values.
        Example: {{"vision": 4.2, "influence": 3.8}}
        """

        response = self.client.chat.completions.create(
            model=self.settings.openai_deployment_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=500,
        )

        try:
            import json
            scores = json.loads(response.choices[0].message.content)
            return scores
        except (json.JSONDecodeError, IndexError) as e:
            logger.error(f"Failed to parse scoring response: {e}")
            raise

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def generate_narrative(
        self,
        dimension_scores: Dict[str, float],
        dimension_descriptions: Dict[str, str],
    ) -> str:
        """
        Generate narrative report based on dimension scores.
        """
        scores_summary = "\n".join(
            [
                f"- {name} ({dimension_descriptions.get(name, name)}): {score:.1f}/5"
                for name, score in dimension_scores.items()
            ]
        )

        prompt = f"""
        You are an expert leadership coach writing an assessment report summary.

        The candidate received these scores:
        {scores_summary}

        Write a compelling 3-4 paragraph narrative that:
        1. Summarizes strengths (scores >= 4)
        2. Identifies development areas (scores <= 2)
        3. Provides actionable insights

        Use a professional but warm tone. Be specific and data-driven.
        """

        response = self.client.chat.completions.create(
            model=self.settings.openai_deployment_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=800,
        )

        return response.choices[0].message.content

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
    )
    async def generate_coaching_plan(
        self,
        dimension_scores: Dict[str, float],
        dimension_descriptions: Dict[str, str],
    ) -> Dict:
        """
        Generate personalized coaching plan based on assessment results.
        """
        low_scores = {
            k: v for k, v in dimension_scores.items() if v <= 2.5
        }

        if not low_scores:
            return {"focus_areas": [], "recommended_actions": []}

        focus_areas = ", ".join(low_scores.keys())

        prompt = f"""
        Based on low scores in these areas: {focus_areas}

        Generate a 90-day coaching plan with:
        - 3 specific development goals
        - 2 recommended actions per goal
        - Success metrics

        Return as JSON with structure:
        {{
            "goals": [
                {{"goal": "...", "actions": ["...", "..."], "metrics": ["..."]}}
            ]
        }}
        """

        response = self.client.chat.completions.create(
            model=self.settings.openai_deployment_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=1000,
        )

        try:
            import json
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return {"focus_areas": list(low_scores.keys()), "error": "Failed to parse plan"}

    def _format_answers_for_prompt(self, answers: List[Dict]) -> str:
        """Format answers for prompt inclusion."""
        formatted = []
        for i, answer in enumerate(answers, 1):
            formatted.append(
                f"{i}. Question: {answer.get('question', 'N/A')}\n"
                f"   Response: {answer.get('response', 'N/A')}"
            )
        return "\n".join(formatted)
