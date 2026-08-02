import { BadRequestException } from '@nestjs/common';
import { dateValidation } from './validation';

describe('dateValidation', () => {
  it('parses a valid past date string', () => {
    const result = dateValidation('2020-01-01', 'dateOfBirth');
    expect(result).toEqual(new Date('2020-01-01'));
  });

  it('throws when required and the value is empty', () => {
    expect(() => dateValidation('', 'dateOfBirth', true)).toThrow(
      new BadRequestException('dateOfBirth is required'),
    );
  });

  it('still throws for an empty value when not required, since it parses to an invalid date', () => {
    expect(() => dateValidation('', 'occurredAt', false)).toThrow(
      new BadRequestException('occurredAt must be a valid date'),
    );
  });

  it('throws when the string is not a parseable date', () => {
    expect(() => dateValidation('not-a-date', 'occurredAt')).toThrow(
      new BadRequestException('occurredAt must be a valid date'),
    );
  });

  it('throws when the date is in the future', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    expect(() => dateValidation(futureDate, 'occurredAt')).toThrow(
      new BadRequestException('occurredAt cannot be in the future'),
    );
  });

  it('accepts the current moment', () => {
    const now = new Date().toISOString();
    expect(() => dateValidation(now, 'occurredAt')).not.toThrow();
  });
});
