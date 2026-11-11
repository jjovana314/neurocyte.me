import {
  OnsetVector,
  MotorFeature,
  SeizureTrigger,
} from '../enums/seizureEnums';

export class CreateSeizureLogDto {
  patientId: number;
  onsetVector: OnsetVector;
  motorFeatures?: MotorFeature[];
  ictusStart: string;
  ictusEnd: string;
  postictalDurationMinutes?: number;
  triggers?: SeizureTrigger[];
  notes?: string;
}
