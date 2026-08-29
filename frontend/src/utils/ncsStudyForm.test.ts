import { describe, expect, it } from 'vitest';
import { EMPTY_NCS_STUDY_FORM_STATE, ncsStudyFormStateToInput } from './ncsStudyForm';

describe('ncsStudyFormStateToInput', () => {
  const filledDistalOnly = {
    ...EMPTY_NCS_STUDY_FORM_STATE,
    nerveName: 'Ulnar',
    studyType: 'SENSORY' as const,
    distanceMm: '200',
    distalLatencyMs: '3.1',
    distalAmplitude: '12',
  };

  it('coerces the numeric distal-site fields and omits the proximal site by default', () => {
    const result = ncsStudyFormStateToInput(filledDistalOnly);

    expect(result).toEqual({
      nerveName: 'Ulnar',
      studyType: 'SENSORY',
      distanceMm: 200,
      distalSite: { latencyMs: 3.1, amplitude: 12, durationMs: undefined },
      proximalSite: undefined,
      skinTemperatureCelsius: undefined,
    });
  });

  it('maps a blank distal duration to undefined but keeps a provided one', () => {
    expect(ncsStudyFormStateToInput(filledDistalOnly).distalSite.durationMs).toBeUndefined();
    expect(
      ncsStudyFormStateToInput({ ...filledDistalOnly, distalDurationMs: '4.5' }).distalSite
        .durationMs,
    ).toBe(4.5);
  });

  it('includes the proximal site only when the checkbox is set', () => {
    const result = ncsStudyFormStateToInput({
      ...filledDistalOnly,
      includeProximalSite: true,
      proximalLatencyMs: '7.2',
      proximalAmplitude: '9',
      proximalDurationMs: '5',
    });

    expect(result.proximalSite).toEqual({ latencyMs: 7.2, amplitude: 9, durationMs: 5 });
  });

  it('passes skin temperature through when supplied', () => {
    expect(
      ncsStudyFormStateToInput({ ...filledDistalOnly, skinTemperatureCelsius: '32.5' })
        .skinTemperatureCelsius,
    ).toBe(32.5);
  });
});
