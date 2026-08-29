import { describe, expect, it } from 'vitest';
import { EMPTY_SEIZURE_LOG_FORM_STATE, seizureLogFormStateToInput } from './seizureLogForm';

describe('seizureLogFormStateToInput', () => {
  it('returns undefined while the section is disabled', () => {
    expect(seizureLogFormStateToInput(EMPTY_SEIZURE_LOG_FORM_STATE)).toBeUndefined();
  });

  it('converts the ictus timestamps to ISO strings and drops blank optionals', () => {
    const result = seizureLogFormStateToInput({
      ...EMPTY_SEIZURE_LOG_FORM_STATE,
      enabled: true,
      ictusStart: '2024-03-01T10:00',
      ictusEnd: '2024-03-01T10:02',
    });

    expect(result).toEqual({
      onsetVector: 'FOCAL_AWARE',
      motorFeatures: [],
      ictusStart: new Date('2024-03-01T10:00').toISOString(),
      ictusEnd: new Date('2024-03-01T10:02').toISOString(),
      postictalDurationMinutes: undefined,
      triggers: [],
      notes: undefined,
    });
  });

  it('passes through populated optional fields', () => {
    const result = seizureLogFormStateToInput({
      enabled: true,
      onsetVector: 'GENERALIZED',
      motorFeatures: ['TONIC', 'CLONIC'],
      ictusStart: '2024-03-01T10:00',
      ictusEnd: '2024-03-01T10:05',
      postictalDurationMinutes: '15',
      triggers: ['SLEEP_DEPRIVATION'],
      notes: 'witnessed',
    });

    expect(result).toMatchObject({
      onsetVector: 'GENERALIZED',
      motorFeatures: ['TONIC', 'CLONIC'],
      postictalDurationMinutes: 15,
      triggers: ['SLEEP_DEPRIVATION'],
      notes: 'witnessed',
    });
  });
});
