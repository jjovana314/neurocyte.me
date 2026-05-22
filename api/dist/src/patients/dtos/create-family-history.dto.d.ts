import { DiseaseType } from '../entities/family-history.entity';
export declare class CreateFamilyHistoryDto {
    patientId: number;
    diseaseType: DiseaseType;
    relation: string;
    severity?: string;
    notes?: string;
}
