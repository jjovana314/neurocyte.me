import { BadRequestException } from '@nestjs/common';
import {
  calculateEdssScore,
  validateFunctionalScores,
} from './edss-calculator';

const noAmbulationImpairment = {
  unassistedWalkingDistanceMeters: 1000,
  requiresUnilateralAid: false,
  requiresBilateralAid: false,
  wheelchairBound: false,
};

const zeroScores = {
  pyramidalSystem: 0,
  cerebellarSystem: 0,
  brainstemSystem: 0,
  sensorySystem: 0,
  bowelBladderSystem: 0,
  visualSystem: 0,
  mentalSystem: 0,
};

describe('validateFunctionalScores', () => {
  it('should throw when a FSS grade exceeds its max', () => {
    expect(() =>
      validateFunctionalScores({ ...zeroScores, pyramidalSystem: 7 }),
    ).toThrow(BadRequestException);
  });

  it('should throw when a FSS grade is negative', () => {
    expect(() =>
      validateFunctionalScores({ ...zeroScores, cerebellarSystem: -1 }),
    ).toThrow(BadRequestException);
  });

  it('should throw when a FSS grade is not an integer', () => {
    expect(() =>
      validateFunctionalScores({ ...zeroScores, sensorySystem: 2.5 }),
    ).toThrow(BadRequestException);
  });

  it('should not throw for scores within bounds', () => {
    expect(() =>
      validateFunctionalScores({ ...zeroScores, mentalSystem: 5 }),
    ).not.toThrow();
  });
});

describe('calculateEdssScore', () => {
  it('should return 0.0 for all-zero FSS with full ambulation', () => {
    expect(calculateEdssScore(zeroScores, noAmbulationImpairment)).toBe(0.0);
  });

  it('should return 1.0 for a single FS at grade 1', () => {
    const scores = { ...zeroScores, sensorySystem: 1 };
    expect(calculateEdssScore(scores, noAmbulationImpairment)).toBe(1.0);
  });

  it('should return 1.5 for two FS at grade 1', () => {
    const scores = { ...zeroScores, sensorySystem: 1, visualSystem: 1 };
    expect(calculateEdssScore(scores, noAmbulationImpairment)).toBe(1.5);
  });

  it('should return 2.0 for a single FS at grade 2', () => {
    const scores = { ...zeroScores, cerebellarSystem: 2 };
    expect(calculateEdssScore(scores, noAmbulationImpairment)).toBe(2.0);
  });

  it('should return 3.0 for exactly one FS at grade 3', () => {
    const scores = { ...zeroScores, pyramidalSystem: 3 };
    expect(calculateEdssScore(scores, noAmbulationImpairment)).toBe(3.0);
  });

  it('should return 3.0 for three to four FS at grade 2', () => {
    const scores = {
      ...zeroScores,
      pyramidalSystem: 2,
      cerebellarSystem: 2,
      sensorySystem: 2,
    };
    expect(calculateEdssScore(scores, noAmbulationImpairment)).toBe(3.0);
  });

  it('should derive 4.0 from an unaided walking distance of 500m', () => {
    const ambulation = {
      ...noAmbulationImpairment,
      unassistedWalkingDistanceMeters: 500,
    };
    expect(calculateEdssScore(zeroScores, ambulation)).toBe(4.0);
  });

  it('should derive 4.5 from an unaided walking distance of 300m', () => {
    const ambulation = {
      ...noAmbulationImpairment,
      unassistedWalkingDistanceMeters: 300,
    };
    expect(calculateEdssScore(zeroScores, ambulation)).toBe(4.5);
  });

  it('should derive 6.0 when a unilateral aid is required', () => {
    const ambulation = {
      ...noAmbulationImpairment,
      requiresUnilateralAid: true,
    };
    expect(calculateEdssScore(zeroScores, ambulation)).toBe(6.0);
  });

  it('should derive 6.5 when a bilateral aid is required', () => {
    const ambulation = {
      ...noAmbulationImpairment,
      requiresBilateralAid: true,
    };
    expect(calculateEdssScore(zeroScores, ambulation)).toBe(6.5);
  });

  it('should derive 7.0 when wheelchair-bound', () => {
    const ambulation = { ...noAmbulationImpairment, wheelchairBound: true };
    expect(calculateEdssScore(zeroScores, ambulation)).toBe(7.0);
  });

  it('should take the more severe of FSS-derived and ambulation-derived scores', () => {
    const scores = { ...zeroScores, pyramidalSystem: 1 }; // FSS alone -> 1.0
    const ambulation = {
      ...noAmbulationImpairment,
      requiresBilateralAid: true,
    }; // -> 6.5
    expect(calculateEdssScore(scores, ambulation)).toBe(6.5);
  });

  it('should not let a mild FSS profile understate a severe ambulation-driven score', () => {
    const scores = { ...zeroScores, mentalSystem: 2 }; // FSS alone -> 2.0
    const ambulation = { ...noAmbulationImpairment, wheelchairBound: true };
    expect(calculateEdssScore(scores, ambulation)).toBe(7.0);
  });
});
