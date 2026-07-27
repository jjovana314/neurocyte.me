from dataclasses import dataclass
from typing import Dict, Optional


class InvalidFunctionalScoreError(ValueError):
    """Raised when functional system scores fail validation."""
    pass


@dataclass
class EdssFunctionalScores:
    pyramidal_system: int  # 0-6
    cerebellar_system: int  # 0-5
    brainstem_system: int  # 0-5
    sensory_system: int  # 0-6
    bowel_bladder_system: int  # 0-6
    visual_system: int  # 0-6
    mental_system: int  # 0-5


@dataclass
class EdssAmbulationMetrics:
    unassisted_walking_distance_meters: Optional[float] = None
    requires_unilateral_aid: Optional[bool] = False
    requires_bilateral_aid: Optional[bool] = False
    wheelchair_bound: Optional[bool] = False


FSS_BOUNDS: Dict[str, int] = {
    "pyramidal_system": 6,
    "cerebellar_system": 5,
    "brainstem_system": 5,
    "sensory_system": 6,
    "bowel_bladder_system": 6,
    "visual_system": 6,
    "mental_system": 5,
}


def validate_functional_scores(scores: EdssFunctionalScores) -> None:
    for field, max_val in FSS_BOUNDS.items():
        value = getattr(scores, field, None)

        if value is None:
            raise InvalidFunctionalScoreError(f"{field} is required")

        # Ensure value is an integer and within valid clinical bounds
        if not isinstance(value, int) or isinstance(value, bool) or not (0 <= value <= max_val):
            raise InvalidFunctionalScoreError(
                f"{field} must be an integer between 0 and {max_val}"
            )


def _round_to_half_step(score: float) -> float:
    return round(score * 2) / 2


def _score_from_functional_systems(scores: EdssFunctionalScores) -> float:
    values = [
        scores.pyramidal_system,
        scores.cerebellar_system,
        scores.brainstem_system,
        scores.sensory_system,
        scores.bowel_bladder_system,
        scores.visual_system,
        scores.mental_system,
    ]
    max_grade_of_disability = max(values)
    
    # Counts how many systems share a specific severity grade
    def count_at(grade: int) -> int:
        return values.count(grade)

    if max_grade_of_disability == 0:
        return 0.0
    if max_grade_of_disability == 1:
        return 1.0 if count_at(1) == 1 else 1.5

    if max_grade_of_disability == 2:
        count_two = count_at(2)
        if count_two == 1:
            return 2.0
        if count_two == 2:
            return 2.5
        if 3 <= count_two <= 4:
            return 3.0
        return 3.5  # count_two == 5

    if max_grade_of_disability == 3:
        count_three = count_at(3)
        if count_three == 1:
            return 3.0
        if count_three == 2:
            return 3.5
        return 4.0  # 3+ FS at grade 3

    if max_grade_of_disability == 4:
        return 4.0 if count_at(4) == 1 else 4.5

    # max_grade_of_disability >= 5: let ambulation take over from here
    return 4.5


def _score_from_ambulation(ambulation: EdssAmbulationMetrics) -> float:
    if ambulation.wheelchair_bound:
        return 7.0
    if ambulation.requires_bilateral_aid:
        return 6.5
    if ambulation.requires_unilateral_aid:
        return 6.0

    distance = ambulation.unassisted_walking_distance_meters

    # If distance is missing, None, or effectively unrestricted (> 500m)
    if distance is None or distance > 500:
        return 0.0

    # Evaluate from shortest (most severe) to longest (least severe) distance
    if distance <= 100:
        return 5.5
    if distance <= 200:
        return 5.0  # Limited daily activity, can walk ~200m
    if distance <= 300:
        return 4.5

    # distance is between 301 and 500 meters
    return 4.0


def calculate_edss_score(
    scores: EdssFunctionalScores,
    ambulation: EdssAmbulationMetrics,
) -> float:
    validate_functional_scores(scores)

    fss_score = _score_from_functional_systems(scores)
    ambulation_score = _score_from_ambulation(ambulation)

    return _round_to_half_step(max(fss_score, ambulation_score))