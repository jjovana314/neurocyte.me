export class CreateFamilyHistoryDto {
  patientId: number;
  diseaseType: string;
  relation: string;
  severity?: string; // mild, moderate, severe
  notes?: string;
}
