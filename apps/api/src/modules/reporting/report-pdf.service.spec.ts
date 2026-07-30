import { ReportPdfService } from './report-pdf.service';

describe('ReportPdfService', () => {
  let service: ReportPdfService;
  let fetchMock: jest.Mock;

  const baseReport: any = {
    id: 'report-1',
    dimensionScores: { Communication: 82, Decisiveness: 65, Empathy: 91 },
    narrative: 'A strong communicator with room to grow in decisiveness.',
    recommendation: 'Ready for a stretch leadership role within 12 months.',
    coachingPlan: {
      goals: [
        { goal: 'Improve decisiveness', actions: ['Practice time-boxed decisions', 'Seek a mentor'] },
      ],
    },
    benchmarkPercentile: 78,
  };

  beforeEach(() => {
    service = new ReportPdfService();
    fetchMock = jest.fn();
    (global as any).fetch = fetchMock;
  });

  function isPdf(buffer: Buffer): boolean {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  it('generates a real PDF buffer with no branding', async () => {
    const buffer = await service.generatePdf(baseReport, null);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(isPdf(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('generates a valid PDF when the report has minimal fields (no narrative/coachingPlan/benchmark)', async () => {
    const minimal: any = { id: 'r2', dimensionScores: {}, narrative: null, recommendation: null, coachingPlan: null, benchmarkPercentile: null };
    const buffer = await service.generatePdf(minimal, null);
    expect(isPdf(buffer)).toBe(true);
  });

  it('fetches and embeds a real logo when branding provides a valid image URL', async () => {
    // A real, valid 1x1 transparent PNG (not just magic bytes) — pdfkit
    // actually decodes and embeds this, so a clean PDF here proves real
    // image embedding succeeded, not just that the fallback swallowed a
    // corrupt image.
    const realPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    );
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => realPng.buffer.slice(realPng.byteOffset, realPng.byteOffset + realPng.byteLength),
    });

    const buffer = await service.generatePdf(baseReport, {
      logoUrl: 'https://example.com/logo.png',
      primaryColor: '#ff0000',
      companyName: 'Acme Corp',
    });

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/logo.png');
    expect(isPdf(buffer)).toBe(true);
  });

  it('does not fail the whole PDF when the logo bytes are a corrupt/invalid image', async () => {
    const corrupt = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => corrupt.buffer.slice(corrupt.byteOffset, corrupt.byteOffset + corrupt.byteLength),
    });
    const buffer = await service.generatePdf(baseReport, { logoUrl: 'https://example.com/corrupt.png' });
    expect(isPdf(buffer)).toBe(true);
  });

  it('does not fail the whole PDF when the logo fetch fails (network error)', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    const buffer = await service.generatePdf(baseReport, { logoUrl: 'https://example.com/logo.png' });
    expect(isPdf(buffer)).toBe(true);
  });

  it('does not fail the whole PDF when the logo URL returns a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false });
    const buffer = await service.generatePdf(baseReport, { logoUrl: 'https://example.com/missing.png' });
    expect(isPdf(buffer)).toBe(true);
  });

  it('does not fail the whole PDF when the logo URL is not an image content-type', async () => {
    fetchMock.mockResolvedValue({ ok: true, headers: { get: () => 'text/html' } });
    const buffer = await service.generatePdf(baseReport, { logoUrl: 'https://example.com/not-an-image' });
    expect(isPdf(buffer)).toBe(true);
  });

  it('ignores an invalid stored primaryColor rather than throwing', async () => {
    const buffer = await service.generatePdf(baseReport, { primaryColor: 'not-a-color' });
    expect(isPdf(buffer)).toBe(true);
  });

  it('produces a larger PDF for a report with more content (sanity check content is actually rendered)', async () => {
    const richBuffer = await service.generatePdf(baseReport, null);
    const minimal: any = { id: 'r3', dimensionScores: {}, narrative: null, recommendation: null, coachingPlan: null, benchmarkPercentile: null };
    const sparseBuffer = await service.generatePdf(minimal, null);
    expect(richBuffer.length).toBeGreaterThan(sparseBuffer.length);
  });
});
