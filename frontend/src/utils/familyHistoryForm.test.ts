import { describe, expect, it } from 'vitest';
import { EMPTY_FAMILY_HISTORY_FORM_STATE, familyHistoryFormStateToInput } from './familyHistoryForm';

describe('familyHistoryFormStateToInput', () => {
  it('returns undefined when the form has not been enabled', () => {
    expect(familyHistoryFormStateToInput(EMPTY_FAMILY_HISTORY_FORM_STATE)).toBeUndefined();
  });

  it('maps blank optional fields to undefined once enabled', () => {
    const result = familyHistoryFormStateToInput({
      ...EMPTY_FAMILY_HISTORY_FORM_STATE,
      enabled: true,
      diseaseType: 'Epilepsy',
      relation: 'Father',
    });

    expect(result).toEqual({
      diseaseType: 'Epilepsy',
      relation: 'Father',
      severity: 'moderate',
      notes: undefined,
    });
  });

  it('passes through every filled-in field', () => {
    const result = familyHistoryFormStateToInput({
      enabled: true,
      diseaseType: 'Alzheimer',
      relation: 'Grandparent',
      severity: 'severe',
      notes: 'Onset at 70',
    });

    expect(result).toEqual({
      diseaseType: 'Alzheimer',
      relation: 'Grandparent',
      severity: 'severe',
      notes: 'Onset at 70',
    });
  });

  it('defaults severity to moderate', () => {
    expect(EMPTY_FAMILY_HISTORY_FORM_STATE.severity).toBe('moderate');
  });
});
