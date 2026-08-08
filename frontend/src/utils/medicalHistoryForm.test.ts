import { describe, expect, it } from 'vitest';
import { EMPTY_MEDICAL_HISTORY_FORM_STATE, medicalHistoryFormStateToInput } from './medicalHistoryForm';

describe('medicalHistoryFormStateToInput', () => {
  it('returns undefined when the form has not been enabled', () => {
    expect(medicalHistoryFormStateToInput(EMPTY_MEDICAL_HISTORY_FORM_STATE)).toBeUndefined();
  });

  it('maps blank optional fields to undefined once enabled', () => {
    const result = medicalHistoryFormStateToInput({
      ...EMPTY_MEDICAL_HISTORY_FORM_STATE,
      enabled: true,
      disorder: 'Multiple sclerosis',
    });

    expect(result).toEqual({
      disorder: 'Multiple sclerosis',
      description: undefined,
      diagnosisDate: undefined,
      severity: 'moderate',
      medications: undefined,
    });
  });

  it('passes through every filled-in field', () => {
    const result = medicalHistoryFormStateToInput({
      enabled: true,
      disorder: 'Multiple sclerosis',
      description: 'Relapsing-remitting',
      diagnosisDate: '2015-06-01',
      severity: 'severe',
      medications: 'Interferon beta-1a',
    });

    expect(result).toEqual({
      disorder: 'Multiple sclerosis',
      description: 'Relapsing-remitting',
      diagnosisDate: '2015-06-01',
      severity: 'severe',
      medications: 'Interferon beta-1a',
    });
  });

  it('defaults severity to moderate', () => {
    expect(EMPTY_MEDICAL_HISTORY_FORM_STATE.severity).toBe('moderate');
  });
});
