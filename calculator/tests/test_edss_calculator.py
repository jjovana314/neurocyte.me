import pytest

from edss_calculator import (
    EdssAmbulationMetrics,
    EdssFunctionalScores,
    InvalidFunctionalScoreError,
    _round_to_half_step,
    _score_from_ambulation,
    _score_from_functional_systems,
    calculate_edss_score,
    validate_functional_scores,
)


def make_scores(**overrides) -> EdssFunctionalScores:
    defaults = dict(
        pyramidal_system=0,
        cerebellar_system=0,
        brainstem_system=0,
        sensory_system=0,
        bowel_bladder_system=0,
        visual_system=0,
        mental_system=0,
    )
    defaults.update(overrides)
    return EdssFunctionalScores(**defaults)


class TestValidateFunctionalScores:
    def test_all_zero_is_valid(self):
        validate_functional_scores(make_scores())

    def test_value_at_upper_bound_is_valid(self):
        validate_functional_scores(make_scores(pyramidal_system=6))

    @pytest.mark.parametrize(
        "field,max_val",
        [
            ("pyramidal_system", 6),
            ("cerebellar_system", 5),
            ("brainstem_system", 5),
            ("sensory_system", 6),
            ("bowel_bladder_system", 6),
            ("visual_system", 6),
            ("mental_system", 5),
        ],
    )
    def test_value_above_bound_raises(self, field, max_val):
        with pytest.raises(InvalidFunctionalScoreError):
            validate_functional_scores(make_scores(**{field: max_val + 1}))

    def test_negative_value_raises(self):
        with pytest.raises(InvalidFunctionalScoreError):
            validate_functional_scores(make_scores(pyramidal_system=-1))

    def test_missing_value_raises(self):
        with pytest.raises(InvalidFunctionalScoreError, match="mental_system is required"):
            validate_functional_scores(make_scores(mental_system=None))

    def test_non_integer_value_raises(self):
        with pytest.raises(InvalidFunctionalScoreError):
            validate_functional_scores(make_scores(sensory_system=2.5))

    def test_boolean_value_raises(self):
        with pytest.raises(InvalidFunctionalScoreError):
            validate_functional_scores(make_scores(visual_system=True))


class TestRoundToHalfStep:
    @pytest.mark.parametrize(
        "raw,expected",
        [
            (0.24, 0.0),
            (0.26, 0.5),
            (2.1, 2.0),
            (2.3, 2.5),
            (4.0, 4.0),
        ],
    )
    def test_rounds_to_nearest_half(self, raw, expected):
        assert _round_to_half_step(raw) == expected


class TestScoreFromFunctionalSystems:
    def test_all_zero_scores_zero(self):
        assert _score_from_functional_systems(make_scores()) == 0.0

    def test_single_system_at_grade_one(self):
        assert _score_from_functional_systems(make_scores(pyramidal_system=1)) == 1.0

    def test_two_systems_at_grade_one(self):
        scores = make_scores(pyramidal_system=1, sensory_system=1)
        assert _score_from_functional_systems(scores) == 1.5

    def test_single_system_at_grade_two(self):
        assert _score_from_functional_systems(make_scores(cerebellar_system=2)) == 2.0

    def test_two_systems_at_grade_two(self):
        scores = make_scores(cerebellar_system=2, brainstem_system=2)
        assert _score_from_functional_systems(scores) == 2.5

    def test_four_systems_at_grade_two(self):
        scores = make_scores(
            pyramidal_system=2,
            cerebellar_system=2,
            brainstem_system=2,
            sensory_system=2,
        )
        assert _score_from_functional_systems(scores) == 3.0

    def test_five_systems_at_grade_two(self):
        scores = make_scores(
            pyramidal_system=2,
            cerebellar_system=2,
            brainstem_system=2,
            sensory_system=2,
            bowel_bladder_system=2,
        )
        assert _score_from_functional_systems(scores) == 3.5

    def test_single_system_at_grade_three(self):
        assert _score_from_functional_systems(make_scores(sensory_system=3)) == 3.0

    def test_two_systems_at_grade_three(self):
        scores = make_scores(sensory_system=3, visual_system=3)
        assert _score_from_functional_systems(scores) == 3.5

    def test_three_systems_at_grade_three(self):
        scores = make_scores(sensory_system=3, visual_system=3, mental_system=3)
        assert _score_from_functional_systems(scores) == 4.0

    def test_single_system_at_grade_four(self):
        assert _score_from_functional_systems(make_scores(pyramidal_system=4)) == 4.0

    def test_two_systems_at_grade_four(self):
        scores = make_scores(pyramidal_system=4, sensory_system=4)
        assert _score_from_functional_systems(scores) == 4.5

    def test_grade_five_defers_to_ambulation(self):
        assert _score_from_functional_systems(make_scores(pyramidal_system=5)) == 4.5


class TestScoreFromAmbulation:
    def test_wheelchair_bound_takes_precedence(self):
        ambulation = EdssAmbulationMetrics(
            wheelchair_bound=True,
            requires_bilateral_aid=True,
            requires_unilateral_aid=True,
        )
        assert _score_from_ambulation(ambulation) == 7.0

    def test_bilateral_aid(self):
        assert _score_from_ambulation(EdssAmbulationMetrics(requires_bilateral_aid=True)) == 6.5

    def test_unilateral_aid(self):
        assert _score_from_ambulation(EdssAmbulationMetrics(requires_unilateral_aid=True)) == 6.0

    def test_distance_none_is_unrestricted(self):
        assert _score_from_ambulation(EdssAmbulationMetrics()) == 0.0

    def test_distance_over_500_is_unrestricted(self):
        ambulation = EdssAmbulationMetrics(unassisted_walking_distance_meters=600)
        assert _score_from_ambulation(ambulation) == 0.0

    @pytest.mark.parametrize(
        "distance,expected",
        [
            (100, 5.5),
            (200, 5.0),
            (300, 4.5),
            (500, 4.0),
            (350, 4.0),
        ],
    )
    def test_distance_thresholds(self, distance, expected):
        ambulation = EdssAmbulationMetrics(unassisted_walking_distance_meters=distance)
        assert _score_from_ambulation(ambulation) == expected


class TestCalculateEdssScore:
    def test_no_impairment_scores_zero(self):
        assert calculate_edss_score(make_scores(), EdssAmbulationMetrics()) == 0.0

    def test_ambulation_overrides_low_functional_score(self):
        score = calculate_edss_score(
            make_scores(),
            EdssAmbulationMetrics(wheelchair_bound=True),
        )
        assert score == 7.0

    def test_functional_score_overrides_unrestricted_ambulation(self):
        score = calculate_edss_score(
            make_scores(pyramidal_system=2),
            EdssAmbulationMetrics(unassisted_walking_distance_meters=1000),
        )
        assert score == 2.0

    def test_invalid_scores_propagate(self):
        with pytest.raises(InvalidFunctionalScoreError):
            calculate_edss_score(make_scores(pyramidal_system=99), EdssAmbulationMetrics())
