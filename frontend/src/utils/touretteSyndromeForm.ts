import type {
  CreateTouretteSyndromeDto,
  TouretteSyndrome,
  TouretteTrigger,
  TycType,
  UpdateTouretteSyndromeDto,
} from '../api/types';

export interface TouretteSyndromeFormState {
  enabled: boolean;
  tycType: TycType;
  severityScale: number;
  premonitoryUrgeLevel: number;
  triggers: TouretteTrigger[];
  medicationTaken: string;
  notes: string;
}

export const EMPTY_TOURETTE_SYNDROME_FORM_STATE: TouretteSyndromeFormState = {
  enabled: false,
  tycType: 'MOTOR_SIMPLE',
  severityScale: 0,
  premonitoryUrgeLevel: 0,
  triggers: [],
  medicationTaken: '',
  notes: '',
};

export function touretteSyndromeFormStateToInput(
  state: TouretteSyndromeFormState,
): CreateTouretteSyndromeDto | undefined {
  if (!state.enabled) return undefined;
  return {
    tycType: state.tycType,
    severityScale: state.severityScale,
    premonitoryUrgeLevel: state.premonitoryUrgeLevel,
    triggers: state.triggers,
    medicationTaken: state.medicationTaken || undefined,
    notes: state.notes || undefined,
  };
}

/**
 * Unlike the create input, blank text fields are sent as '' so that clearing
 * them in the edit form actually clears them on the backend.
 */
export function touretteSyndromeFormStateToUpdate(
  state: TouretteSyndromeFormState,
): UpdateTouretteSyndromeDto {
  return {
    tycType: state.tycType,
    severityScale: state.severityScale,
    premonitoryUrgeLevel: state.premonitoryUrgeLevel,
    triggers: state.triggers,
    medicationTaken: state.medicationTaken,
    notes: state.notes,
  };
}

export function touretteSyndromeToFormState(record: TouretteSyndrome): TouretteSyndromeFormState {
  return {
    enabled: true,
    tycType: record.tycType,
    severityScale: record.severityScale,
    premonitoryUrgeLevel: record.premonitoryUrgeLevel,
    triggers: record.triggers ?? [],
    medicationTaken: record.medicationTaken ?? '',
    notes: record.notes ?? '',
  };
}
