import type { CreateNcsStudyDto, NcsStudyType } from '../api/types';

export interface NcsStudyFormState {
  nerveName: string;
  studyType: NcsStudyType;
  distanceMm: string;
  distalLatencyMs: string;
  distalAmplitude: string;
  distalDurationMs: string;
  includeProximalSite: boolean;
  proximalLatencyMs: string;
  proximalAmplitude: string;
  proximalDurationMs: string;
  skinTemperatureCelsius: string;
}

export const EMPTY_NCS_STUDY_FORM_STATE: NcsStudyFormState = {
  nerveName: 'Median',
  studyType: 'MOTOR',
  distanceMm: '',
  distalLatencyMs: '',
  distalAmplitude: '',
  distalDurationMs: '',
  includeProximalSite: false,
  proximalLatencyMs: '',
  proximalAmplitude: '',
  proximalDurationMs: '',
  skinTemperatureCelsius: '',
};

export function ncsStudyFormStateToInput(
  state: NcsStudyFormState,
): Omit<CreateNcsStudyDto, 'patientId'> {
  return {
    nerveName: state.nerveName,
    studyType: state.studyType,
    distanceMm: Number(state.distanceMm),
    distalSite: {
      latencyMs: Number(state.distalLatencyMs),
      amplitude: Number(state.distalAmplitude),
      durationMs: state.distalDurationMs ? Number(state.distalDurationMs) : undefined,
    },
    proximalSite: state.includeProximalSite
      ? {
          latencyMs: Number(state.proximalLatencyMs),
          amplitude: Number(state.proximalAmplitude),
          durationMs: state.proximalDurationMs
            ? Number(state.proximalDurationMs)
            : undefined,
        }
      : undefined,
    skinTemperatureCelsius: state.skinTemperatureCelsius
      ? Number(state.skinTemperatureCelsius)
      : undefined,
  };
}
