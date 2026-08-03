import type { NcsStudyType } from '../api/types';

// Values mirror the backend enum (api/src/patients/entities/ncs-study.entity.ts)
export const NCS_STUDY_TYPE_OPTIONS: { value: NcsStudyType; label: string }[] = [
  { value: 'MOTOR', label: 'Motor (CMAP)' },
  { value: 'SENSORY', label: 'Sensory (SNAP)' },
];

export type NcsAnatomicRegion = 'UPPER_EXTREMITY' | 'LOWER_EXTREMITY';

// Order here drives both the nerve datalist and the anatomic region / nerve
// sort order for a patient's NCS results table (see utils/ncsStudySort.ts).
export const NCS_NERVE_DEFINITIONS: { name: string; region: NcsAnatomicRegion }[] = [
  { name: 'Median', region: 'UPPER_EXTREMITY' },
  { name: 'Ulnar', region: 'UPPER_EXTREMITY' },
  { name: 'Radial', region: 'UPPER_EXTREMITY' },
  { name: 'Peroneal', region: 'LOWER_EXTREMITY' },
  { name: 'Tibial', region: 'LOWER_EXTREMITY' },
  { name: 'Sural', region: 'LOWER_EXTREMITY' },
  { name: 'Superficial Peroneal', region: 'LOWER_EXTREMITY' },
];

export const NCS_NERVE_OPTIONS = NCS_NERVE_DEFINITIONS.map((n) => n.name);

// Column order expected by POST /patients/:id/ncs-studies/import (header row required, not validated by name)
export const NCS_CSV_IMPORT_HINT =
  'Optional. Columns: nerveName, studyType (MOTOR/SENSORY), distanceMm, distalLatencyMs, ' +
  'distalAmplitude, distalDurationMs, proximalLatencyMs, proximalAmplitude, proximalDurationMs, ' +
  'skinTemperatureCelsius. Each row is sent to the calculator for conduction velocity and diagnosis.';
