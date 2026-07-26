import type { MotorFeature, OnsetVector, SeizureTrigger } from '../api/types';

// Values mirror the backend enums (api/src/patients/entities/seizure-log.entity.ts)
export const ONSET_VECTOR_OPTIONS: { value: OnsetVector; label: string }[] = [
  { value: 'FOCAL_AWARE', label: 'Focal aware' },
  { value: 'FOCAL_IMPAIRED_AWARENESS', label: 'Focal impaired awareness' },
  { value: 'GENERALIZED', label: 'Generalized' },
];

export const MOTOR_FEATURE_OPTIONS: { value: MotorFeature; label: string }[] = [
  { value: 'TONIC', label: 'Tonic (stiffening)' },
  { value: 'CLONIC', label: 'Clonic (rhythmic jerking)' },
  { value: 'ATONIC', label: 'Atonic (drop attack)' },
  { value: 'AUTOMATISMS', label: 'Automatisms (lip-smacking, picking)' },
];

export const SEIZURE_TRIGGER_OPTIONS: { value: SeizureTrigger; label: string }[] = [
  { value: 'SLEEP_DEPRIVATION', label: 'Sleep deprivation' },
  { value: 'MISSED_DOSE', label: 'Missed medication dose' },
  { value: 'HIGH_STRESS', label: 'High stress' },
  { value: 'ILLNESS', label: 'Illness' },
];
