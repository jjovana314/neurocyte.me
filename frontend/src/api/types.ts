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
}

export interface CreatePatientDto {
  name: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  notes?: string;
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
