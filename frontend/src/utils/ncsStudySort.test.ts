import { describe, expect, it } from 'vitest';
import type { NcsStudy } from '../api/types';
import { sortNcsStudies } from './ncsStudySort';

function study(overrides: Partial<NcsStudy> & { nerveName: string }): NcsStudy {
  return {
    id: 1,
    patientId: 1,
    studyType: 'MOTOR',
    distanceMm: 100,
    distalLatencyMs: 3,
    distalAmplitude: 10,
    distalDurationMs: null,
    proximalLatencyMs: null,
    proximalAmplitude: null,
    proximalDurationMs: null,
    skinTemperatureCelsius: null,
    conductionVelocityMPerS: null,
    amplitudeDropPercent: null,
    temporalDispersionPercent: null,
    isNormal: true,
    axonalLoss: false,
    demyelination: false,
    conductionBlock: false,
    diagnosticSummary: '',
    recordedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const names = (studies: NcsStudy[]) => studies.map((s) => s.nerveName);

describe('sortNcsStudies', () => {
  it('does not mutate the input array', () => {
    const input = [study({ nerveName: 'Tibial' }), study({ nerveName: 'Median' })];
    const before = names(input);
    sortNcsStudies(input);
    expect(names(input)).toEqual(before);
  });

  it('orders upper-extremity nerves before lower-extremity nerves', () => {
    const sorted = sortNcsStudies([
      study({ nerveName: 'Left Tibial' }),
      study({ nerveName: 'Left Median' }),
    ]);
    expect(names(sorted)).toEqual(['Left Median', 'Left Tibial']);
  });

  it('does not misclassify "Superficial Peroneal" as the shorter "Peroneal" match', () => {
    const sorted = sortNcsStudies([
      study({ nerveName: 'Superficial Peroneal' }),
      study({ nerveName: 'Sural' }),
      study({ nerveName: 'Peroneal' }),
    ]);
    // All lower-extremity, so this is a pure nerve-name localeCompare.
    expect(names(sorted)).toEqual(['Peroneal', 'Superficial Peroneal', 'Sural']);
  });

  it('sorts motor before sensory for the same nerve', () => {
    const sorted = sortNcsStudies([
      study({ nerveName: 'Median', studyType: 'SENSORY' }),
      study({ nerveName: 'Median', studyType: 'MOTOR' }),
    ]);
    expect(sorted.map((s) => s.studyType)).toEqual(['MOTOR', 'SENSORY']);
  });

  it('sorts left before right before unspecified for the same nerve and type', () => {
    const sorted = sortNcsStudies([
      study({ nerveName: 'Median (R)' }),
      study({ nerveName: 'Median' }),
      study({ nerveName: 'Left Median' }),
    ]);
    expect(names(sorted)).toEqual(['Left Median', 'Median (R)', 'Median']);
  });

  it('breaks a full tie by most-recent recordedAt first', () => {
    const sorted = sortNcsStudies([
      study({ nerveName: 'Median', recordedAt: '2024-01-01T00:00:00.000Z' }),
      study({ nerveName: 'Median', recordedAt: '2024-06-01T00:00:00.000Z' }),
    ]);
    expect(sorted.map((s) => s.recordedAt)).toEqual([
      '2024-06-01T00:00:00.000Z',
      '2024-01-01T00:00:00.000Z',
    ]);
  });

  it('places unknown nerve names after all known regions', () => {
    const sorted = sortNcsStudies([
      study({ nerveName: 'Phrenic' }),
      study({ nerveName: 'Median' }),
      study({ nerveName: 'Tibial' }),
    ]);
    expect(names(sorted)).toEqual(['Median', 'Tibial', 'Phrenic']);
  });
});
