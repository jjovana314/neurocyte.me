import { EdssAssessmentDataDto } from './edss-assessment-data.dto';

export class UpdatePatientNotesDto {
  notes: string;
  edss?: EdssAssessmentDataDto;
}
