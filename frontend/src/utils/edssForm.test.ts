import { describe, expect, it } from 'vitest';
import { EMPTY_EDSS_FORM_STATE, edssFormStateToInput } from './edssForm';

describe('edssFormStateToInput', () => {
  it('returns undefined while the section is disabled', () => {
    expect(edssFormStateToInput(EMPTY_EDSS_FORM_STATE)).toBeUndefined();
  });

  it('passes the functional-system scores through and leaves a blank walking distance undefined', () => {
    const result = edssFormStateToInput({
      ...EMPTY_EDSS_FORM_STATE,
      enabled: true,
      pyramidalSystem: 3,
      visualSystem: 2,
    });

    expect(result).toEqual({
      pyramidalSystem: 3,
      cerebellarSystem: 0,
      brainstemSystem: 0,
      sensorySystem: 0,
      bowelBladderSystem: 0,
      visualSystem: 2,
      mentalSystem: 0,
      unassistedWalkingDistanceMeters: undefined,
      requiresUnilateralAid: false,
      requiresBilateralAid: false,
      wheelchairBound: false,
    });
  });

  it('coerces the walking distance and carries the ambulation flags', () => {
    const result = edssFormStateToInput({
      ...EMPTY_EDSS_FORM_STATE,
      enabled: true,
      unassistedWalkingDistanceMeters: '120',
      requiresUnilateralAid: true,
      wheelchairBound: true,
    });

    expect(result).toMatchObject({
      unassistedWalkingDistanceMeters: 120,
      requiresUnilateralAid: true,
      requiresBilateralAid: false,
      wheelchairBound: true,
    });
  });
});
