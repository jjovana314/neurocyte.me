// Must match PatientRecordType in api/src/patients/enums/patient-record-type.ts.
export type PatientRecordType =
  | 'medicalHistory'
  | 'familyHistory'
  | 'edssAssessments'
  | 'migraineLogs'
  | 'seizureLogs'
  | 'ncsStudies'
  | 'touretteSyndrom';

export const RECORD_TYPE_OPTIONS: { value: PatientRecordType; label: string }[] = [
  { value: 'medicalHistory', label: 'Medical History' },
  { value: 'familyHistory', label: 'Family History' },
  { value: 'edssAssessments', label: 'EDSS Assessment' },
  { value: 'migraineLogs', label: 'Migraine Log' },
  { value: 'seizureLogs', label: 'Seizure Log' },
  { value: 'touretteSyndrom', label: 'Tourette Syndrome' },
  { value: 'ncsStudies', label: 'NCS Studies' },
];
