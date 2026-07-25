export class CreateMigraineLogDto {
  patientId: number;
  occurredAt: string;
  durationMinutes?: number;
  painSeverity: number; // 1-10
  auraPresent?: boolean;
  triggers?: string;
  symptoms?: string;
  medicationTaken?: string;
  notes?: string;
}
