import { EdssAssessmentDataDto } from './edss-assessment-data.dto';
import { IsString, MaxLength } from 'class-validator';

export class UpdatePatientDto {
  @IsString()
  @MaxLength(50000)
  notes: string;

  edss?: EdssAssessmentDataDto;
}
