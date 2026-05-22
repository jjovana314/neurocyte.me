import { Patient } from './patient.entity';
export declare class PatientHistory {
    id: number;
    patientId: number;
    patient: Patient;
    disorder: string;
    description: string;
    diagnosisDate: string;
    severity: string;
    medications: string;
    recordedAt: Date;
}
