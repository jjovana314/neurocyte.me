import type { CreatePatientHistoryDto } from '../api/types';

export interface MedicalHistoryFormState {
  enabled: boolean;
  disorder: string;
  description: string;
  diagnosisDate: string;
  severity: string;
  medications: string;
}

export const EMPTY_MEDICAL_HISTORY_FORM_STATE: MedicalHistoryFormState = {
  enabled: false,
  disorder: '',
  description: '',
  diagnosisDate: '',
  severity: 'moderate',
  medications: '',
};

export function medicalHistoryFormStateToInput(
  state: MedicalHistoryFormState,
): Omit<CreatePatientHistoryDto, 'patientId'> | undefined {
  if (!state.enabled) return undefined;
  return {
    disorder: state.disorder,
    description: state.description || undefined,
    diagnosisDate: state.diagnosisDate || undefined,
    severity: state.severity || undefined,
    medications: state.medications || undefined,
  };
}
