import logging
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from typing import Dict
from io import BytesIO

logger = logging.getLogger(__name__)


class PDFService:
    """Generate PDF reports from assessment data."""

    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._add_custom_styles()

    def _add_custom_styles(self):
        """Add custom paragraph styles."""
        self.styles.add(
            ParagraphStyle(
                name="CustomTitle",
                parent=self.styles["Heading1"],
                fontSize=24,
                textColor=colors.HexColor("#1e40af"),
                spaceAfter=30,
            )
        )
        self.styles.add(
            ParagraphStyle(
                name="SectionHeading",
                parent=self.styles["Heading2"],
                fontSize=14,
                textColor=colors.HexColor("#1e40af"),
                spaceAfter=12,
                spaceBefore=12,
            )
        )

    def generate_report_pdf(
        self,
        user_name: str,
        dimension_scores: Dict[str, float],
        narrative: str,
        benchmark_percentile: int,
        coaching_plan: Dict,
    ) -> bytes:
        """Generate PDF report and return as bytes."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.75 * inch,
            leftMargin=0.75 * inch,
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )

        elements = []

        # Title
        title = Paragraph(
            f"Leadership Assessment Report<br/>{user_name}",
            self.styles["CustomTitle"],
        )
        elements.append(title)
        elements.append(Spacer(1, 0.3 * inch))

        # Scores Table
        elements.append(
            Paragraph("Competency Dimension Scores", self.styles["SectionHeading"])
        )

        score_data = [["Dimension", "Score", "Rating"]]
        for dimension, score in dimension_scores.items():
            rating = self._get_rating(score)
            score_data.append([dimension, f"{score:.1f}/5", rating])

        score_table = Table(score_data, colWidths=[3 * inch, 1 * inch, 1.5 * inch])
        score_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e40af")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 11),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                ]
            )
        )
        elements.append(score_table)
        elements.append(Spacer(1, 0.3 * inch))

        # Narrative
        elements.append(
            Paragraph("Executive Summary", self.styles["SectionHeading"])
        )
        narrative_para = Paragraph(narrative, self.styles["BodyText"])
        elements.append(narrative_para)
        elements.append(Spacer(1, 0.3 * inch))

        # Benchmark
        elements.append(
            Paragraph("Benchmark Percentile", self.styles["SectionHeading"])
        )
        benchmark_text = f"You rank in the <b>{benchmark_percentile}th percentile</b> compared to peer organizations in your benchmark group."
        elements.append(Paragraph(benchmark_text, self.styles["BodyText"]))
        elements.append(Spacer(1, 0.3 * inch))

        # Coaching Plan
        if coaching_plan.get("goals"):
            elements.append(
                Paragraph("90-Day Coaching Plan", self.styles["SectionHeading"])
            )
            for goal_item in coaching_plan["goals"]:
                goal_text = f"<b>Goal:</b> {goal_item.get('goal', 'N/A')}"
                elements.append(Paragraph(goal_text, self.styles["BodyText"]))
                elements.append(Spacer(1, 0.1 * inch))

        # Build PDF
        doc.build(elements)
        return buffer.getvalue()

    def _get_rating(self, score: float) -> str:
        """Convert numeric score to rating label."""
        if score >= 4.5:
            return "Exceptional"
        elif score >= 3.5:
            return "Exceeds"
        elif score >= 2.5:
            return "Meets"
        elif score >= 1.5:
            return "Below"
        else:
            return "Minimal"
