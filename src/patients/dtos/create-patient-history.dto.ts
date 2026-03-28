export class CreatePatientHistoryDto {
  patientId: number;
  disorder: string;
  description?: string;
  diagnosisDate?: string;
  severity?: string; // mild, moderate, severe
  medications?: string;
}
