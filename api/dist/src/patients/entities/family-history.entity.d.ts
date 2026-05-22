import { Patient } from './patient.entity';
export declare enum DiseaseType {
    ALZHEIMER = "Alzheimer",
    PARKINSON = "Parkinson",
    STROKE = "Stroke",
    EPILEPSY = "Epilepsy",
    BRAIN_TUMOR = "Brain Tumor",
    MULTIPLE_SCLEROSIS = "Multiple Sclerosis"
}
export declare class FamilyHistory {
    id: number;
    patientId: number;
    patient: Patient;
    diseaseType: DiseaseType;
    relation: string;
    severity: string;
    notes: string;
    recordedAt: Date;
}
