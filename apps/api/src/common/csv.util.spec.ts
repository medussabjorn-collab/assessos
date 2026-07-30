import { toCsv } from './csv.util';

describe('toCsv', () => {
  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
  ];

  it('serializes a header row plus one row per record', () => {
    const csv = toCsv([{ name: 'Jane Doe', email: 'jane@acme.test' }], columns);
    expect(csv).toBe('Name,Email\r\nJane Doe,jane@acme.test');
  });

  it('produces header-only output for an empty rows array', () => {
    expect(toCsv([], columns)).toBe('Name,Email');
  });

  it('quotes and escapes a field containing a comma', () => {
    const csv = toCsv([{ name: 'Doe, Jane', email: 'jane@acme.test' }], columns);
    expect(csv).toBe('Name,Email\r\n"Doe, Jane",jane@acme.test');
  });

  it('quotes a field containing a double quote, doubling it per RFC 4180', () => {
    const csv = toCsv([{ name: 'The "Great" Jane', email: 'jane@acme.test' }], columns);
    expect(csv).toBe('Name,Email\r\n"The ""Great"" Jane",jane@acme.test');
  });

  it('quotes a field containing a newline', () => {
    const csv = toCsv([{ name: 'Jane\nDoe', email: 'jane@acme.test' }], columns);
    expect(csv).toBe('Name,Email\r\n"Jane\nDoe",jane@acme.test');
  });

  it('renders null/undefined fields as empty strings, not the literal word', () => {
    const csv = toCsv([{ name: null, email: undefined }], columns);
    expect(csv).toBe('Name,Email\r\n,');
  });

  it('renders multiple rows in order', () => {
    const csv = toCsv(
      [
        { name: 'Jane', email: 'jane@acme.test' },
        { name: 'John', email: 'john@acme.test' },
      ],
      columns,
    );
    expect(csv).toBe('Name,Email\r\nJane,jane@acme.test\r\nJohn,john@acme.test');
  });

  it('coerces non-string values (numbers, booleans) to their string form', () => {
    const csv = toCsv([{ score: 87, active: true }], [
      { key: 'score', header: 'Score' },
      { key: 'active', header: 'Active' },
    ]);
    expect(csv).toBe('Score,Active\r\n87,true');
  });
});
