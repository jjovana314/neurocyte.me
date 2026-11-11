import { describe, expect, it } from 'vitest';
import type { TouretteSyndrome } from '../api/types';
import {
  EMPTY_TOURETTE_SYNDROME_FORM_STATE,
  touretteSyndromeFormStateToInput,
  touretteSyndromeFormStateToUpdate,
  touretteSyndromeToFormState,
} from './touretteSyndromeForm';

describe('touretteSyndromeFormStateToInput', () => {
  it('returns undefined while the section is disabled', () => {
    expect(touretteSyndromeFormStateToInput(EMPTY_TOURETTE_SYNDROME_FORM_STATE)).toBeUndefined();
  });

  it('drops blank optional text fields', () => {
    expect(
      touretteSyndromeFormStateToInput({ ...EMPTY_TOURETTE_SYNDROME_FORM_STATE, enabled: true }),
    ).toEqual({
      tycType: 'MOTOR_SIMPLE',
      severityScale: 0,
      premonitoryUrgeLevel: 0,
      triggers: [],
      medicationTaken: undefined,
      notes: undefined,
    });
  });

  it('passes through populated fields', () => {
    expect(
      touretteSyndromeFormStateToInput({
        enabled: true,
        tycType: 'VOCAL_COMPLEX',
        severityScale: 7,
        premonitoryUrgeLevel: 5,
        triggers: ['STRESS', 'FATIGUE'],
        medicationTaken: 'Aripiprazole 5mg',
        notes: 'worse in the evening',
      }),
    ).toEqual({
      tycType: 'VOCAL_COMPLEX',
      severityScale: 7,
      premonitoryUrgeLevel: 5,
      triggers: ['STRESS', 'FATIGUE'],
      medicationTaken: 'Aripiprazole 5mg',
      notes: 'worse in the evening',
    });
  });
});

describe('touretteSyndromeFormStateToUpdate', () => {
  it('sends cleared text fields as empty strings so they are cleared on the backend', () => {
    const result = touretteSyndromeFormStateToUpdate({
      ...EMPTY_TOURETTE_SYNDROME_FORM_STATE,
      enabled: true,
    });
    expect(result.notes).toBe('');
    expect(result.medicationTaken).toBe('');
  });
});

describe('touretteSyndromeToFormState', () => {
  it('maps a stored record into an editable form state', () => {
    const record: TouretteSyndrome = {
      id: 3,
      patientId: 5,
      tycType: 'MOTOR_COMPLEX',
      recordedAt: '2026-11-01T10:00:00.000Z',
      severityScale: 6,
      premonitoryUrgeLevel: 4,
      triggers: ['BOREDOM'],
      notes: null,
      medicationTaken: null,
    };

    expect(touretteSyndromeToFormState(record)).toEqual({
      enabled: true,
      tycType: 'MOTOR_COMPLEX',
      severityScale: 6,
      premonitoryUrgeLevel: 4,
      triggers: ['BOREDOM'],
      medicationTaken: '',
      notes: '',
    });
  });
});
