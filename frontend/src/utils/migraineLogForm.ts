import type { CreateMigraineLogDto } from '../api/types';

export interface MigraineLogFormState {
  enabled: boolean;
  occurredAt: string;
  durationMinutes: string;
  painSeverity: number;
  auraPresent: boolean;
  triggers: string;
  symptoms: string;
  medicationTaken: string;
  notes: string;
}

export const EMPTY_MIGRAINE_LOG_FORM_STATE: MigraineLogFormState = {
  enabled: false,
  occurredAt: '',
  durationMinutes: '',
  painSeverity: 5,
  auraPresent: false,
  triggers: '',
  symptoms: '',
  medicationTaken: '',
  notes: '',
};

export function migraineLogFormStateToInput(
  state: MigraineLogFormState,
): Omit<CreateMigraineLogDto, 'patientId'> | undefined {
  if (!state.enabled) return undefined;
  return {
    occurredAt: new Date(state.occurredAt).toISOString(),
    durationMinutes: state.durationMinutes ? Number(state.durationMinutes) : undefined,
    painSeverity: state.painSeverity,
    auraPresent: state.auraPresent,
    triggers: state.triggers || undefined,
    symptoms: state.symptoms || undefined,
    medicationTaken: state.medicationTaken || undefined,
    notes: state.notes || undefined,
  };
}
