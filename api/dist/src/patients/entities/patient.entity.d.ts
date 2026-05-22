import { User } from 'src/auth/entites/user.entity';
import { PatientHistory } from './patient-history.entity';
import { FamilyHistory } from './family-history.entity';
export declare class Patient {
    id: number;
    doctorId: number;
    doctor: User;
    name: string;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
    medicalHistory: PatientHistory[];
    familyHistory: FamilyHistory[];
}
