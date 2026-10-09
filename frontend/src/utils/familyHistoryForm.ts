import type { CreateFamilyHistoryDto } from '../api/types';

export interface FamilyHistoryFormState {
  enabled: boolean;
  diseaseType: string;
  relation: string;
  severity: string;
  notes: string;
}

export const EMPTY_FAMILY_HISTORY_FORM_STATE: FamilyHistoryFormState = {
  enabled: false,
  diseaseType: '',
  relation: '',
  severity: 'moderate',
  notes: '',
};

export function familyHistoryFormStateToInput(
  state: FamilyHistoryFormState,
): Omit<CreateFamilyHistoryDto, 'patientId'> | undefined {
  if (!state.enabled) return undefined;
  return {
    diseaseType: state.diseaseType,
    relation: state.relation,
    severity: state.severity || undefined,
    notes: state.notes || undefined,
  };
}
