// RFC 4180-style CSV serialization. A field is quoted whenever it contains a
// comma, double quote, or newline — internal quotes are doubled per spec,
// not backslash-escaped (CSV has no escape character).
function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export interface CsvColumn {
  key: string;
  header: string;
}

export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]): string {
  const headerLine = columns.map((c) => escapeCsvField(c.header)).join(',');
  const dataLines = rows.map((row) => columns.map((c) => escapeCsvField(row[c.key])).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}
