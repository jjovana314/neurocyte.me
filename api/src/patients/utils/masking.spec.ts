import { maskString } from './masking';

describe('maskString', () => {
  it('masks a non-empty string with a fixed run of x characters', () => {
    expect(maskString('John Doe')).toBe('xxxxxx');
  });

  it('masks a single character the same as a long string', () => {
    expect(maskString('a')).toBe('xxxxxx');
  });

  it('returns N/A for null', () => {
    expect(maskString(null)).toBe('N/A');
  });

  it('returns N/A for an empty string', () => {
    expect(maskString('')).toBe('N/A');
  });
});
