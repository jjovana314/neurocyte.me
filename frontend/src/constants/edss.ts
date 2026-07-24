export interface EdssFssFieldDef {
  key:
    | 'pyramidalSystem'
    | 'cerebellarSystem'
    | 'brainstemSystem'
    | 'sensorySystem'
    | 'bowelBladderSystem'
    | 'visualSystem'
    | 'mentalSystem';
  label: string;
  max: number;
}

// Grade bounds mirror the backend's Kurtzke FSS scale (api/src/patients/utils/edss-calculator.ts)
export const EDSS_FSS_FIELDS: EdssFssFieldDef[] = [
  { key: 'pyramidalSystem', label: 'Pyramidal', max: 6 },
  { key: 'cerebellarSystem', label: 'Cerebellar', max: 5 },
  { key: 'brainstemSystem', label: 'Brainstem', max: 5 },
  { key: 'sensorySystem', label: 'Sensory', max: 6 },
  { key: 'bowelBladderSystem', label: 'Bowel & Bladder', max: 6 },
  { key: 'visualSystem', label: 'Visual', max: 6 },
  { key: 'mentalSystem', label: 'Cerebral / Mental', max: 5 },
];
