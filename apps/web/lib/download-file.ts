'use client';

// Shared browser-download trigger — same blob-URL pattern already used for
// the PDF report export and the GDPR JSON data export, factored out once
// it had a third real caller (CSV exports).
export function downloadBlob(data: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
