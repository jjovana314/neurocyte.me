import { EdssAssessmentDataDto } from './edss-assessment-data.dto';
import { CreateMigraineLogDto } from './create-migraine-log.dto';
import { CreateSeizureLogDto } from './create-seizure-log.dto';

export class CreatePatientDto {
  name: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  notes: string;
  edss?: EdssAssessmentDataDto;
  migraineLog?: Omit<CreateMigraineLogDto, 'patientId'>;
  seizureLog?: Omit<CreateSeizureLogDto, 'patientId'>;
}
