import { EdssAssessmentDataDto } from './edss-assessment-data.dto';

export class CreatePatientDto {
  name: string;
  dateOfBirth: string;
  gender: string;
  phone?: string;
  email?: string;
  notes: string;
  edss?: EdssAssessmentDataDto;
}
