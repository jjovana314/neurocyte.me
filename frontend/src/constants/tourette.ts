import type { TouretteTrigger, TycType } from '../api/types';

// Values mirror the backend enums (api/src/patients/enums/touretteTycType.ts, touretteTrigger.ts)
export const TYC_TYPE_OPTIONS: { value: TycType; label: string }[] = [
  { value: 'MOTOR_SIMPLE', label: 'Motor - simple' },
  { value: 'MOTOR_COMPLEX', label: 'Motor - complex' },
  { value: 'VOCAL_SIMPLE', label: 'Vocal - simple' },
  { value: 'VOCAL_COMPLEX', label: 'Vocal - complex' },
];

export const TOURETTE_TRIGGER_OPTIONS: { value: TouretteTrigger; label: string }[] = [
  { value: 'STRESS', label: 'Stress' },
  { value: 'EXCITEMENT', label: 'Excitement' },
  { value: 'ANGER', label: 'Anger' },
  { value: 'FATIGUE', label: 'Fatigue' },
  { value: 'ILLNESS', label: 'Illness' },
  { value: 'BOREDOM', label: 'Boredom' },
  { value: 'SENSORY_ENVIRONMENT', label: 'Sensory environment' },
  { value: 'REBOUND_EFFECT', label: 'Rebound effect' },
];

// The backend doesn't bound these yet; 0-10 matches the other severity inputs in the app.
export const TOURETTE_SCALE_MIN = 0;
export const URGE_LEVEN_TOURETTE_SCALE_MAX = 10;
export const SEVERITY_SCALE_TOURETTE_MAX = 50;