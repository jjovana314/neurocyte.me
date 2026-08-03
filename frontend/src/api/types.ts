export interface Role {
  id: number;
  name: string;
}

export interface JwtPayload {
  id: number;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PatientHistory {
  id: number;
  patientId: number;
  disorder: string;
  description: string;
  diagnosisDate: string | null;
  severity: string;
  medications: string;
  recordedAt: string;
}

export interface FamilyHistory {
  id: number;
  patientId: number;
  diseaseType: string;
  relation: string;
  severity: string;
  notes: string;
  recordedAt: string;
}

export interface EdssAssessment {
  id: number;
  patientId: number;
  assessedAt: string;
  pyramidalSystem: number;
  cerebellarSystem: number;
  brainstemSystem: number;
  sensorySystem: number;
  bowelBladderSystem: number;
  visualSystem: number;
  mentalSystem: number;
  unassistedWalkingDistanceMeters: number | null;
  requiresUnilateralAid: boolean;
  requiresBilateralAid: boolean;
  wheelchairBound: boolean;
  totalScore: number;
}

export interface EdssAssessmentInput {
  pyramidalSystem: number;
  cerebellarSystem: number;
  brainstemSystem: number;
  sensorySystem: number;
  bowelBladderSystem: number;
  visualSystem: number;
  mentalSystem: number;
  unassistedWalkingDistanceMeters?: number;
  requiresUnilateralAid?: boolean;
  requiresBilateralAid?: boolean;
  wheelchairBound?: boolean;
}

export interface MigraineLog {
  id: number;
  patientId: number;
  occurredAt: string;
  durationMinutes: number | null;
  painSeverity: number;
  auraPresent: boolean;
  triggers: string;
  symptoms: string;
  medicationTaken: string;
  notes: string;
  recordedAt: string;
}

export interface CreateMigraineLogDto {
  patientId?: number;
  occurredAt: string;
  durationMinutes?: number;
  painSeverity: number;
  auraPresent?: boolean;
  triggers?: string;
  symptoms?: string;
  medicationTaken?: string;
  notes?: string;
}

export type OnsetVector = 'FOCAL_AWARE' | 'FOCAL_IMPAIRED_AWARENESS' | 'GENERALIZED';
export type MotorFeature = 'TONIC' | 'CLONIC' | 'ATONIC' | 'AUTOMATISMS';
export type SeizureTrigger = 'SLEEP_DEPRIVATION' | 'MISSED_DOSE' | 'HIGH_STRESS' | 'ILLNESS';

export interface SeizureLog {
  id: number;
  patientId: number;
  onsetVector: OnsetVector;
  motorFeatures: MotorFeature[];
  ictusStart: string;
  ictusEnd: string;
  ictusDurationSeconds: number;
  postictalDurationMinutes: number | null;
  triggers: SeizureTrigger[];
  notes: string;
  recordedAt: string;
}

export interface CreateSeizureLogDto {
  patientId?: number;
  onsetVector: OnsetVector;
  motorFeatures?: MotorFeature[];
  ictusStart: string;
  ictusEnd: string;
  postictalDurationMinutes?: number;
  triggers?: SeizureTrigger[];
  notes?: string;
}

export type NcsStudyType = 'MOTOR' | 'SENSORY';

export interface NcsSegmentMeasurement {
  latencyMs: number;
  amplitude: number; // mV for Motor (CMAP), uV for Sensory (SNAP)
  durationMs?: number | null;
}

export interface NcsStudy {
  id: number;
  patientId: number;
  nerveName: string;
  studyType: NcsStudyType;
  distanceMm: number;
  distalLatencyMs: number;
  distalAmplitude: number;
  distalDurationMs: number | null;
  proximalLatencyMs: number | null;
  proximalAmplitude: number | null;
  proximalDurationMs: number | null;
  skinTemperatureCelsius: number | null;
  conductionVelocityMPerS: number | null;
  amplitudeDropPercent: number | null;
  temporalDispersionPercent: number | null;
  isNormal: boolean;
  axonalLoss: boolean;
  demyelination: boolean;
  conductionBlock: boolean;
  diagnosticSummary: string;
  recordedAt: string;
}

export interface CreateNcsStudyDto {
  patientId?: number;
  nerveName: string;
  studyType: NcsStudyType;
  distanceMm: number;
  distalSite: NcsSegmentMeasurement;
  proximalSite?: NcsSegmentMeasurement;
  skinTemperatureCelsius?: number;
}

export interface Patient {
  id: number;
  doctorId: number;
  name: string;
  dateOfBirth: string;
  gender: string;
  phone: string | null;
  email: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  medicalHistory: PatientHistory[];
  familyHistory: FamilyHistory[];
  edssAssessments: EdssAssessment[];
  migraineLogs: MigraineLog[];
  seizureLogs: SeizureLog[];
  ncsStudies: NcsStudy[];
}

export interface CreatePatientDto {
  name: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  notes?: string;
  edss?: EdssAssessmentInput;
  migraineLog?: Omit<CreateMigraineLogDto, 'patientId'>;
  seizureLog?: Omit<CreateSeizureLogDto, 'patientId'>;
}

export interface UpdatePatientDto {
  notes: string;
  edss?: EdssAssessmentInput;
}

export interface CreatePatientHistoryDto {
  patientId?: number;
  disorder: string;
  description?: string;
  diagnosisDate?: string;
  severity?: string;
  medications?: string;
}

export interface CreateFamilyHistoryDto {
  patientId?: number;
  diseaseType: string;
  relation: string;
  severity?: string;
  notes?: string;
}

export interface ImportCsvResponse {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}
