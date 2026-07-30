import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import type { AiReport } from '@prisma/client';
import type { WhiteLabelSettings } from '../tenant/white-label.service';

interface CoachingGoal {
  goal: string;
  actions: string[];
}

const DEFAULT_ACCENT = '#4f46e5';
const PAGE_MARGIN = 50;

@Injectable()
export class ReportPdfService {
  private readonly logger = new Logger(ReportPdfService.name);

  // Renders the same content ReportView.tsx already shows from the AiReport
  // row (dimension scores, narrative, recommendation, coaching plan,
  // benchmark percentile) into a real PDF — no headless-browser dependency,
  // pdfkit draws directly. Branding is applied when present, but a missing
  // or unreachable logo/color must never fail the whole export — a report
  // without branding is still a valid report.
  async generatePdf(report: AiReport, branding: WhiteLabelSettings | null): Promise<Buffer> {
    const accent = this.normalizeColor(branding?.primaryColor) ?? DEFAULT_ACCENT;
    const logo = branding?.logoUrl ? await this.fetchLogo(branding.logoUrl) : null;

    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.renderHeader(doc, accent, logo, branding?.companyName);
    this.renderDimensionScores(doc, accent, (report.dimensionScores as Record<string, number>) ?? {});
    this.renderNarrative(doc, accent, report.narrative);
    this.renderRecommendation(doc, accent, report.recommendation);
    this.renderCoachingPlan(doc, accent, report.coachingPlan as { goals: CoachingGoal[] } | null);
    this.renderBenchmark(doc, report.benchmarkPercentile);
    this.renderFooter(doc, branding?.companyName);

    doc.end();
    return done;
  }

  private normalizeColor(color?: string): string | null {
    if (!color) return null;
    // pdfkit's fillColor accepts hex strings directly — just guard against a
    // clearly-invalid stored value (empty string, non-hex garbage) rather
    // than let it throw deep inside a draw call.
    return /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : null;
  }

  private async fetchLogo(url: string): Promise<Buffer | null> {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.startsWith('image/')) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      this.logger.warn(`Failed to fetch report logo from ${url}: ${err}`);
      return null;
    }
  }

  private renderHeader(doc: PDFKit.PDFDocument, accent: string, logo: Buffer | null, companyName?: string) {
    if (logo) {
      try {
        doc.image(logo, PAGE_MARGIN, PAGE_MARGIN, { width: 80, height: 80, fit: [80, 80] });
      } catch (err) {
        this.logger.warn(`Skipping unrenderable logo image: ${err}`);
      }
    }

    doc
      .fillColor(accent)
      .fontSize(20)
      .text(companyName ? `${companyName} — Leadership Assessment Report` : 'Leadership Assessment Report', logo ? PAGE_MARGIN + 100 : PAGE_MARGIN, PAGE_MARGIN, { width: 400 });
    doc
      .fillColor('#666666')
      .fontSize(10)
      .text(`Generated ${new Date().toLocaleDateString()}`, logo ? PAGE_MARGIN + 100 : PAGE_MARGIN, PAGE_MARGIN + 26);

    doc.moveDown(logo ? 4 : 2);
    doc.strokeColor(accent).lineWidth(2).moveTo(PAGE_MARGIN, doc.y).lineTo(doc.page.width - PAGE_MARGIN, doc.y).stroke();
    doc.moveDown(1);
  }

  private renderDimensionScores(doc: PDFKit.PDFDocument, accent: string, scores: Record<string, number>) {
    const entries = Object.entries(scores);
    if (entries.length === 0) return;

    doc.fillColor('#111111').fontSize(14).text('Dimension Scores', { underline: false });
    doc.moveDown(0.5);

    const barMaxWidth = doc.page.width - PAGE_MARGIN * 2 - 160;
    for (const [dimension, score] of entries) {
      const y = doc.y;
      doc.fillColor('#333333').fontSize(10).text(dimension, PAGE_MARGIN, y, { width: 150 });

      const clamped = Math.max(0, Math.min(100, score));
      const barWidth = (clamped / 100) * barMaxWidth;
      doc.rect(PAGE_MARGIN + 160, y, barMaxWidth, 12).fillColor('#e5e7eb').fill();
      if (barWidth > 0) {
        doc.rect(PAGE_MARGIN + 160, y, barWidth, 12).fillColor(accent).fill();
      }
      doc.fillColor('#111111').fontSize(9).text(String(Math.round(score)), PAGE_MARGIN + 160 + barMaxWidth + 8, y);

      doc.moveDown(1.2);
    }
    doc.moveDown(0.5);
  }

  private renderNarrative(doc: PDFKit.PDFDocument, accent: string, narrative: string | null) {
    if (!narrative) return;
    doc.fillColor(accent).fontSize(14).text('Summary');
    doc.moveDown(0.3);
    doc.fillColor('#333333').fontSize(10).text(narrative, { align: 'left' });
    doc.moveDown(1);
  }

  private renderRecommendation(doc: PDFKit.PDFDocument, accent: string, recommendation: string | null) {
    if (!recommendation) return;
    doc.fillColor(accent).fontSize(14).text('Recommendation');
    doc.moveDown(0.3);
    doc.fillColor('#333333').fontSize(10).text(recommendation);
    doc.moveDown(1);
  }

  private renderCoachingPlan(doc: PDFKit.PDFDocument, accent: string, coachingPlan: { goals: CoachingGoal[] } | null) {
    const goals = coachingPlan?.goals ?? [];
    if (goals.length === 0) return;

    doc.fillColor(accent).fontSize(14).text('Coaching Plan');
    doc.moveDown(0.3);
    for (const goal of goals) {
      doc.fillColor('#111111').fontSize(11).text(`• ${goal.goal}`);
      for (const action of goal.actions ?? []) {
        doc.fillColor('#555555').fontSize(9).text(`   – ${action}`);
      }
      doc.moveDown(0.5);
    }
    doc.moveDown(0.5);
  }

  private renderBenchmark(doc: PDFKit.PDFDocument, benchmarkPercentile: number | null) {
    if (benchmarkPercentile == null) return;
    doc.fillColor('#333333').fontSize(10).text(`Benchmark: ${benchmarkPercentile}th percentile among peers`);
    doc.moveDown(1);
  }

  private renderFooter(doc: PDFKit.PDFDocument, companyName?: string) {
    doc
      .fillColor('#999999')
      .fontSize(8)
      .text(companyName ? `${companyName} · Generated by AssessOS` : 'Generated by AssessOS', PAGE_MARGIN, doc.page.height - 40, {
        width: doc.page.width - PAGE_MARGIN * 2,
        align: 'center',
      });
  }
}
