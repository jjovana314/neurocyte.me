import { describe, expect, it } from 'vitest';
import { EMPTY_MIGRAINE_LOG_FORM_STATE, migraineLogFormStateToInput } from './migraineLogForm';

describe('migraineLogFormStateToInput', () => {
  it('returns undefined while the section is disabled', () => {
    expect(migraineLogFormStateToInput(EMPTY_MIGRAINE_LOG_FORM_STATE)).toBeUndefined();
  });

  it('keeps the numeric pain severity and clears blank optional text/number fields', () => {
    const result = migraineLogFormStateToInput({
      ...EMPTY_MIGRAINE_LOG_FORM_STATE,
      enabled: true,
      occurredAt: '2024-02-14T08:30',
      painSeverity: 7,
    });

    expect(result).toEqual({
      occurredAt: new Date('2024-02-14T08:30').toISOString(),
      durationMinutes: undefined,
      painSeverity: 7,
      auraPresent: false,
      triggers: undefined,
      symptoms: undefined,
      medicationTaken: undefined,
      notes: undefined,
    });
  });

  it('coerces the duration and passes through the remaining populated fields', () => {
    const result = migraineLogFormStateToInput({
      enabled: true,
      occurredAt: '2024-02-14T08:30',
      durationMinutes: '90',
      painSeverity: 4,
      auraPresent: true,
      triggers: 'bright light',
      symptoms: 'nausea',
      medicationTaken: 'sumatriptan',
      notes: 'resolved after sleep',
    });

    expect(result).toMatchObject({
      durationMinutes: 90,
      auraPresent: true,
      triggers: 'bright light',
      symptoms: 'nausea',
      medicationTaken: 'sumatriptan',
      notes: 'resolved after sleep',
    });
  });
});
