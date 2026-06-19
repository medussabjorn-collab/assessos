import { ForbiddenError, NotFoundError, ValidationError } from './errors';

describe('web error types', () => {
  it('ForbiddenError has correct name, default message, and is an Error', () => {
    const e = new ForbiddenError();
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe('ForbiddenError');
    expect(e.message).toBe('Access denied');
  });

  it('NotFoundError preserves a custom message', () => {
    const e = new NotFoundError('Report 42 not found');
    expect(e.name).toBe('NotFoundError');
    expect(e.message).toBe('Report 42 not found');
  });

  it('ValidationError uses its default message', () => {
    const e = new ValidationError();
    expect(e.name).toBe('ValidationError');
    expect(e.message).toBe('Validation failed');
  });

  it('errors are distinguishable by instanceof', () => {
    const e: Error = new ValidationError();
    expect(e instanceof ValidationError).toBe(true);
    expect(e instanceof ForbiddenError).toBe(false);
  });
});
