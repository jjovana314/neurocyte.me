import type { EdssAssessmentInput } from '../api/types';

export interface EdssFormState {
  enabled: boolean;
  pyramidalSystem: number;
  cerebellarSystem: number;
  brainstemSystem: number;
  sensorySystem: number;
  bowelBladderSystem: number;
  visualSystem: number;
  mentalSystem: number;
  unassistedWalkingDistanceMeters: string;
  requiresUnilateralAid: boolean;
  requiresBilateralAid: boolean;
  wheelchairBound: boolean;
}

export const EMPTY_EDSS_FORM_STATE: EdssFormState = {
  enabled: false,
  pyramidalSystem: 0,
  cerebellarSystem: 0,
  brainstemSystem: 0,
  sensorySystem: 0,
  bowelBladderSystem: 0,
  visualSystem: 0,
  mentalSystem: 0,
  unassistedWalkingDistanceMeters: '',
  requiresUnilateralAid: false,
  requiresBilateralAid: false,
  wheelchairBound: false,
};

export function edssFormStateToInput(state: EdssFormState): EdssAssessmentInput | undefined {
  if (!state.enabled) return undefined;
  return {
    pyramidalSystem: state.pyramidalSystem,
    cerebellarSystem: state.cerebellarSystem,
    brainstemSystem: state.brainstemSystem,
    sensorySystem: state.sensorySystem,
    bowelBladderSystem: state.bowelBladderSystem,
    visualSystem: state.visualSystem,
    mentalSystem: state.mentalSystem,
    unassistedWalkingDistanceMeters: state.unassistedWalkingDistanceMeters
      ? Number(state.unassistedWalkingDistanceMeters)
      : undefined,
    requiresUnilateralAid: state.requiresUnilateralAid,
    requiresBilateralAid: state.requiresBilateralAid,
    wheelchairBound: state.wheelchairBound,
  };
}
