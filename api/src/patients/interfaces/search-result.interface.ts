import { Patient } from "../entities/patient.entity";

export interface PatientSearchResult {
    patients: Patient[];
    total: number;
}