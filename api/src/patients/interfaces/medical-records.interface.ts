import { FamilyHistory } from '../entities/family-history.entity';
import { PatientHistory } from '../entities/patient-history.entity';
import { SeizureLog } from '../entities/seizure-log.entity';
import { TouretteSyndrome } from '../entities/tourette-syndrome.entity';

export interface PatientRecords {
  medicalHistory: PatientHistory[];
  familyHistory: FamilyHistory[];
  seizureLogs: SeizureLog[];
  touretteSyndrome: TouretteSyndrome[];
}
