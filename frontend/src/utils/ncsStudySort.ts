import type { NcsStudy, NcsStudyType } from '../api/types';
import { NCS_NERVE_DEFINITIONS, type NcsAnatomicRegion } from '../constants/ncs';

const REGION_ORDER: Record<NcsAnatomicRegion, number> = {
  UPPER_EXTREMITY: 0,
  LOWER_EXTREMITY: 1,
};

const STUDY_TYPE_ORDER: Record<NcsStudyType, number> = {
  MOTOR: 0,
  SENSORY: 1,
};

type Side = 'LEFT' | 'RIGHT' | 'UNSPECIFIED';

const SIDE_ORDER: Record<Side, number> = {
  LEFT: 0,
  RIGHT: 1,
  UNSPECIFIED: 2,
};

// Nerve names are free text (e.g. "Left Median", "Median (R)"), so match the
// longest known nerve name contained in it - "Peroneal" is itself a
// substring of "Superficial Peroneal", so a naive first-match would
// misclassify the latter.
function matchNerveDefinition(nerveName: string) {
  const lower = nerveName.toLowerCase();
  let best: (typeof NCS_NERVE_DEFINITIONS)[number] | null = null;
  for (const def of NCS_NERVE_DEFINITIONS) {
    if (lower.includes(def.name.toLowerCase())) {
      if (!best || def.name.length > best.name.length) {
        best = def;
      }
    }
  }
  return best;
}

function nerveSide(nerveName: string): Side {
  if (/\bleft\b|\(l\)$/i.test(nerveName.trim())) return 'LEFT';
  if (/\bright\b|\(r\)$/i.test(nerveName.trim())) return 'RIGHT';
  return 'UNSPECIFIED';
}

// Category (upper vs. lower extremity) -> nerve -> study type (motor before
// sensory) -> side (left before right) -> most recent first.
export function sortNcsStudies(studies: NcsStudy[]): NcsStudy[] {
  return [...studies].sort((a, b) => {
    const defA = matchNerveDefinition(a.nerveName);
    const defB = matchNerveDefinition(b.nerveName);

    const regionA = defA ? REGION_ORDER[defA.region] : REGION_ORDER.LOWER_EXTREMITY + 1;
    const regionB = defB ? REGION_ORDER[defB.region] : REGION_ORDER.LOWER_EXTREMITY + 1;
    if (regionA !== regionB) return regionA - regionB;

    const nerveKeyA = defA?.name ?? a.nerveName;
    const nerveKeyB = defB?.name ?? b.nerveName;
    if (nerveKeyA !== nerveKeyB) {
      const nerveNameCompare = nerveKeyA.localeCompare(nerveKeyB);
      if (nerveNameCompare !== 0) return nerveNameCompare;
    }

    const typeDiff = STUDY_TYPE_ORDER[a.studyType] - STUDY_TYPE_ORDER[b.studyType];
    if (typeDiff !== 0) return typeDiff;

    const sideDiff = SIDE_ORDER[nerveSide(a.nerveName)] - SIDE_ORDER[nerveSide(b.nerveName)];
    if (sideDiff !== 0) return sideDiff;

    return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
  });
}
