// Values must match the backend DiseaseType enum
// (api/src/patients/entities/family-history.entity.ts) - anything else is
// rejected with a 400.
export const DISEASE_TYPE_OPTIONS: string[] = [
  'Alzheimer',
  'Parkinson',
  'Stroke',
  'Epilepsy',
  'Brain Tumor',
  'Multiple Sclerosis',
];

// Suggestions only - relation is free text on the backend.
export const RELATION_SUGGESTIONS: string[] = [
  'Mother',
  'Father',
  'Sibling',
  'Child',
  'Grandparent',
  'Aunt/Uncle',
  'Cousin',
];
