import type { CreateSeizureLogDto, MotorFeature, OnsetVector, SeizureTrigger } from '../api/types';

export interface SeizureLogFormState {
  enabled: boolean;
  onsetVector: OnsetVector;
  motorFeatures: MotorFeature[];
  ictusStart: string;
  ictusEnd: string;
  postictalDurationMinutes: string;
  triggers: SeizureTrigger[];
  notes: string;
}

export const EMPTY_SEIZURE_LOG_FORM_STATE: SeizureLogFormState = {
  enabled: false,
  onsetVector: 'FOCAL_AWARE',
  motorFeatures: [],
  ictusStart: '',
  ictusEnd: '',
  postictalDurationMinutes: '',
  triggers: [],
  notes: '',
};

export function seizureLogFormStateToInput(
  state: SeizureLogFormState,
): Omit<CreateSeizureLogDto, 'patientId'> | undefined {
  if (!state.enabled) return undefined;
  return {
    onsetVector: state.onsetVector,
    motorFeatures: state.motorFeatures,
    ictusStart: new Date(state.ictusStart).toISOString(),
    ictusEnd: new Date(state.ictusEnd).toISOString(),
    postictalDurationMinutes: state.postictalDurationMinutes
      ? Number(state.postictalDurationMinutes)
      : undefined,
    triggers: state.triggers,
    notes: state.notes || undefined,
  };
}
