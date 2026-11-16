// Record types a patient can be filtered by in search. Values are the
// Patient relation property names, which are also the aliases they're
// joined under in PatientsService.search, so this enum doubles as the
// allowlist for the `<alias>.id IS NOT NULL` clauses built from user input.
export enum PatientRecordType {
  MEDICAL_HISTORY = 'medicalHistory',
  FAMILY_HISTORY = 'familyHistory',
  EDSS_ASSESSMENT = 'edssAssessments',
  MIGRAINE_LOG = 'migraineLogs',
  SEIZURE_LOG = 'seizureLogs',
  NCS_STUDY = 'ncsStudies',
  TOURETTE_SYNDROME = 'touretteSyndrom',
}

const VALID_RECORD_TYPES = new Set<string>(Object.values(PatientRecordType));

export function isPatientRecordType(value: string): value is PatientRecordType {
  return VALID_RECORD_TYPES.has(value);
}
