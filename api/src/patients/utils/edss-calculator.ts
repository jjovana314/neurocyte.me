import { BadRequestException } from '@nestjs/common';

export interface EdssFunctionalScores {
  pyramidalSystem: number; // 0-6
  cerebellarSystem: number; // 0-5
  brainstemSystem: number; // 0-5
  sensorySystem: number; // 0-6
  bowelBladderSystem: number; // 0-6
  visualSystem: number; // 0-6
  mentalSystem: number; // 0-5
}

export interface EdssAmbulationMetrics {
  unassistedWalkingDistanceMeters?: number;
  requiresUnilateralAid?: boolean;
  requiresBilateralAid?: boolean;
  wheelchairBound?: boolean;
}

const FSS_BOUNDS: Record<keyof EdssFunctionalScores, number> = {
  pyramidalSystem: 6,
  cerebellarSystem: 5,
  brainstemSystem: 5,
  sensorySystem: 6,
  bowelBladderSystem: 6,
  visualSystem: 6,
  mentalSystem: 5,
};

export function validateFunctionalScores(scores: EdssFunctionalScores): void {
  for (const [field, max] of Object.entries(FSS_BOUNDS)) {
    const value = scores[field as keyof EdssFunctionalScores];
    if (value === undefined || value === null) {
      throw new BadRequestException(`${field} is required`);
    }
    if (!Number.isInteger(value) || value < 0 || value > max) {
      throw new BadRequestException(
        `${field} must be an integer between 0 and ${max}`,
      );
    }
  }
}

function roundToHalfStep(score: number): number {
  return Math.round(score * 2) / 2;
}

// Approximates Kurtzke's EDSS step definitions from the 7 FSS grades, for the
// band where the patient is still fully ambulatory (steps 0.0-4.5). The
// published scale is prose-based rather than a formula; ties/edge cases here
// default to the lower (less severe) step.
function scoreFromFunctionalSystems(scores: EdssFunctionalScores): number {
  const values = Object.values(scores);
  const maxGradeOfDisability = Math.max(...values);
  // Counts how many systems share a specific severity grade
  const countAt = (grade: number) => values.filter((v) => v === grade).length;

  if (maxGradeOfDisability === 0) return 0.0;
  if (maxGradeOfDisability === 1) return countAt(1) === 1 ? 1.0 : 1.5;
  if (maxGradeOfDisability === 2) {
    if (countAt(2) === 1) return 2.0;
    if (countAt(2) === 2) return 2.5;
    if (countAt(2) >= 3 && countAt(2) <= 4) return 3.0;
    return 3.5; // countAt(2) === 5
  }
  if (maxGradeOfDisability === 3) {
    if (countAt(3) === 1) return 3.0;
    if (countAt(3) === 2) return 3.5;
    return 4.0; // 3+ FS at grade 3
  }
  if (maxGradeOfDisability === 4) {
    return countAt(4) === 1 ? 4.0 : 4.5;
  }
  // maxGradeOfDisability >= 5: at least one FS severe enough that ambulation is normally
  // affected too - let the ambulation-based score take over from here.
  return 4.5;
}

// Ambulation is the primary driver for scores >= 4.0 per Kurtzke. Distance
// thresholds and aid requirements below map directly to the published step
// definitions (500m/300m unaided -> 4.0/4.5, 100m with one aid -> 6.0, 20m
// with two aids -> 6.5, wheelchair-bound -> 7.0).
//
// Note: steps 7.5-9.5 additionally depend on self-care/transfer/communication
// ability, which this model doesn't capture yet - wheelchair-bound patients
// are floored at 7.0 here and should be refined by clinician review.
function scoreFromAmbulation(ambulation: EdssAmbulationMetrics): number {
  if (ambulation.wheelchairBound) return 7.0;
  if (ambulation.requiresBilateralAid) return 6.5;
  if (ambulation.requiresUnilateralAid) return 6.0;

  const distance = ambulation.unassistedWalkingDistanceMeters;

  // If distance is missing, undefined, or effectively unrestricted (> 500m)
  if (distance === undefined || distance === null || distance > 500) {
    return 0.0;
  }

  // Evaluate from shortest (most severe) to longest (least severe) distance
  if (distance <= 100) return 5.5;
  if (distance <= 200) return 5.0; // Limited daily activity, can walk ~200m
  if (distance <= 300) return 4.5;

  // distance is between 301 and 500 meters
  return 4.0;
}

export function calculateEdssScore(
  scores: EdssFunctionalScores,
  ambulation: EdssAmbulationMetrics,
): number {
  validateFunctionalScores(scores);

  const fssScore = scoreFromFunctionalSystems(scores);
  const ambulationScore = scoreFromAmbulation(ambulation);

  return roundToHalfStep(Math.max(fssScore, ambulationScore));
}
