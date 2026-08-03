import type { NcsStudyType } from '../api/types';

// Values mirror the backend enum (api/src/patients/entities/ncs-study.entity.ts)
export const NCS_STUDY_TYPE_OPTIONS: { value: NcsStudyType; label: string }[] = [
  { value: 'MOTOR', label: 'Motor (CMAP)' },
  { value: 'SENSORY', label: 'Sensory (SNAP)' },
];

export const NCS_NERVE_OPTIONS = ['Median', 'Ulnar', 'Peroneal', 'Sural'];
