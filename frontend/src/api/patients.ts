import client from './client';
import type {
  Patient,
  CreatePatientDto,
  CreatePatientHistoryDto,
  CreateFamilyHistoryDto,
  PatientHistory,
  FamilyHistory,
  ImportCsvResponse,
} from './types';

export async function getMyPatients(): Promise<Patient[]> {
  const { data } = await client.get<Patient[]>('/patients/my-patients');
  return data;
}

export async function getPatient(id: number): Promise<Patient> {
  const { data } = await client.get<Patient>(`/patients/${id}`);
  return data;
}

export async function createPatient(dto: CreatePatientDto): Promise<Patient> {
  const { data } = await client.post<Patient>('/patients', dto);
  return data;
}

export async function updatePatientNotes(id: number, notes: string): Promise<Patient> {
  const { data } = await client.put<Patient>(`/patients/${id}`, { notes });
  return data;
}

export async function deletePatient(id: number): Promise<void> {
  await client.delete(`/patients/${id}`);
}

export async function addMedicalHistory(
  patientId: number,
  dto: CreatePatientHistoryDto,
): Promise<PatientHistory> {
  const { data } = await client.post<PatientHistory>(`/patients/${patientId}/history`, dto);
  return data;
}

export async function addFamilyHistory(
  patientId: number,
  dto: CreateFamilyHistoryDto,
): Promise<FamilyHistory> {
  const { data } = await client.post<FamilyHistory>(
    `/patients/${patientId}/family-history`,
    dto,
  );
  return data;
}

export async function exportCsv(): Promise<void> {
  const response = await client.get('/patients/export/csv', { responseType: 'blob' });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'patient_export.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportPatientPdf(patientId: number): Promise<void> {
  const response = await client.get(`/patients/${patientId}/export/pdf`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `patient-${patientId}-report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importCsv(file: File): Promise<ImportCsvResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await client.post<ImportCsvResponse>('/patients/import/csv', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
