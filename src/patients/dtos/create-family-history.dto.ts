import { DiseaseType } from '../entities/family-history.entity';

export class CreateFamilyHistoryDto {
  patientId: number;
  diseaseType: DiseaseType;
  relation: string;
  severity?: string; // mild, moderate, severe
  notes?: string;
}
