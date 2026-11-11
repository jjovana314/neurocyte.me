import { TycType } from '../enums/touretteTycType';
import { TouretteTrigger } from '../enums/touretteTrigger';

export class UpdateTouretteSyndromeDto {
  tycType?: TycType;
  severityScale?: number;
  premonitoryUrgeLevel?: number;
  triggers?: TouretteTrigger[];
  notes?: string;
  medicationTaken?: string;
}
