export class EdssAssessmentDataDto {
  // Functional System Scores (FSS)
  pyramidalSystem: number; // 0-6
  cerebellarSystem: number; // 0-5
  brainstemSystem: number; // 0-5
  sensorySystem: number; // 0-6
  bowelBladderSystem: number; // 0-6
  visualSystem: number; // 0-6
  mentalSystem: number; // 0-5

  // Ambulation metrics
  unassistedWalkingDistanceMeters?: number;
  requiresUnilateralAid?: boolean;
  requiresBilateralAid?: boolean;
  wheelchairBound?: boolean;
}
