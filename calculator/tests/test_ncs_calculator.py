import pytest

from ncs_calculator import (
    InvalidActionPotentialError,
    NcsInput,
    NcsSegmentMeasurement,
    StudyType,
    _apply_temperature_correction,
    _calculate_amplitude_drop,
    _calculate_conduction_velocity,
    _calculate_temporal_dispersion,
    calculate_ncs,
)


def make_ncs(
    nerve_name="MEDIAN",
    study_type=StudyType.MOTOR,
    distance_mm=200.0,
    distal_latency_ms=3.0,
    distal_amplitude=6.0,
    distal_duration_ms=None,
    proximal_latency_ms=None,
    proximal_amplitude=None,
    proximal_duration_ms=None,
    skin_temperature_celsius=None,
) -> NcsInput:
    proximal_site = None
    if proximal_latency_ms is not None:
        proximal_site = NcsSegmentMeasurement(
            latency_ms=proximal_latency_ms,
            amplitude=proximal_amplitude,
            duration_ms=proximal_duration_ms,
        )
    return NcsInput(
        nerve_name=nerve_name,
        study_type=study_type,
        distance_mm=distance_mm,
        distal_site=NcsSegmentMeasurement(
            latency_ms=distal_latency_ms,
            amplitude=distal_amplitude,
            duration_ms=distal_duration_ms,
        ),
        proximal_site=proximal_site,
        skin_temperature_celsius=skin_temperature_celsius,
    )


class TestValidateNcsInput:
    def test_non_positive_distance_raises(self):
        with pytest.raises(InvalidActionPotentialError):
            calculate_ncs(make_ncs(distance_mm=0))

    def test_non_positive_distal_latency_raises(self):
        with pytest.raises(InvalidActionPotentialError):
            calculate_ncs(make_ncs(distal_latency_ms=0))

    def test_negative_distal_amplitude_raises(self):
        with pytest.raises(InvalidActionPotentialError):
            calculate_ncs(make_ncs(distal_amplitude=-1))

    def test_negative_distal_duration_raises(self):
        with pytest.raises(InvalidActionPotentialError, match="Distal site duration_ms"):
            calculate_ncs(make_ncs(distal_duration_ms=-5))

    def test_negative_proximal_duration_raises(self):
        with pytest.raises(InvalidActionPotentialError, match="Proximal site duration_ms"):
            calculate_ncs(
                make_ncs(
                    proximal_latency_ms=7.0,
                    proximal_amplitude=5.0,
                    proximal_duration_ms=-1,
                )
            )

    def test_negative_proximal_amplitude_raises(self):
        with pytest.raises(InvalidActionPotentialError):
            calculate_ncs(make_ncs(proximal_latency_ms=7.0, proximal_amplitude=-1))

    def test_proximal_latency_not_greater_than_distal_raises(self):
        with pytest.raises(InvalidActionPotentialError, match="Proximal latency"):
            calculate_ncs(
                make_ncs(
                    distal_latency_ms=5.0,
                    proximal_latency_ms=5.0,
                    proximal_amplitude=5.0,
                )
            )

    def test_zero_duration_is_valid(self):
        # duration_ms == 0 is falsy but not negative - should not raise.
        calculate_ncs(make_ncs(distal_duration_ms=0))


class TestApplyTemperatureCorrection:
    def test_missing_temperature_leaves_input_unchanged(self):
        ncs = make_ncs()
        assert _apply_temperature_correction(ncs) is ncs

    def test_temperature_at_reference_leaves_input_unchanged(self):
        ncs = make_ncs(skin_temperature_celsius=32.0)
        assert _apply_temperature_correction(ncs) is ncs

    def test_cold_limb_shortens_distal_latency(self):
        ncs = make_ncs(distal_latency_ms=3.0, skin_temperature_celsius=27.0)
        corrected = _apply_temperature_correction(ncs)
        # temp_diff = 5, correction = 0.2 * 5 = 1.0
        assert corrected.distal_site.latency_ms == pytest.approx(2.0)

    def test_correction_floors_at_point_one(self):
        ncs = make_ncs(distal_latency_ms=0.5, skin_temperature_celsius=10.0)
        corrected = _apply_temperature_correction(ncs)
        assert corrected.distal_site.latency_ms == pytest.approx(0.1)

    def test_proximal_site_is_also_corrected(self):
        ncs = make_ncs(
            distal_latency_ms=3.0,
            proximal_latency_ms=7.0,
            proximal_amplitude=5.0,
            skin_temperature_celsius=27.0,
        )
        corrected = _apply_temperature_correction(ncs)
        assert corrected.proximal_site.latency_ms == pytest.approx(6.0)

    def test_no_proximal_site_stays_none(self):
        ncs = make_ncs(skin_temperature_celsius=27.0)
        corrected = _apply_temperature_correction(ncs)
        assert corrected.proximal_site is None


class TestCalculateConductionVelocity:
    def test_standard_calculation(self):
        assert _calculate_conduction_velocity(70.0, 5.0, 2.0) == pytest.approx(23.33)


class TestCalculateAmplitudeDrop:
    def test_standard_drop(self):
        assert _calculate_amplitude_drop(distal_amp=10.0, proximal_amp=3.0) == pytest.approx(70.0)

    def test_zero_distal_amplitude_returns_zero(self):
        assert _calculate_amplitude_drop(distal_amp=0.0, proximal_amp=3.0) == 0.0

    def test_negative_drop_is_floored_at_zero(self):
        assert _calculate_amplitude_drop(distal_amp=5.0, proximal_amp=8.0) == 0.0


class TestCalculateTemporalDispersion:
    def test_missing_distal_duration_returns_none(self):
        assert _calculate_temporal_dispersion(None, 6.0) is None

    def test_missing_proximal_duration_returns_none(self):
        assert _calculate_temporal_dispersion(5.0, None) is None

    def test_zero_distal_duration_returns_none(self):
        assert _calculate_temporal_dispersion(0.0, 6.0) is None

    def test_standard_dispersion(self):
        assert _calculate_temporal_dispersion(2.0, 3.0) == pytest.approx(50.0)

    def test_negative_dispersion_is_floored_at_zero(self):
        assert _calculate_temporal_dispersion(5.0, 3.0) == 0.0


class TestCalculateNcs:
    def test_normal_study_is_classified_normal(self):
        result = calculate_ncs(
            make_ncs(
                nerve_name="MEDIAN",
                study_type=StudyType.MOTOR,
                distance_mm=200.0,
                distal_latency_ms=3.0,
                distal_amplitude=6.0,
                proximal_latency_ms=7.0,
                proximal_amplitude=5.5,
            )
        )
        assert result.is_normal is True
        assert result.axonal_loss is False
        assert result.demyelination is False
        assert result.conduction_block is False
        assert result.conduction_velocity_m_per_s == pytest.approx(50.0)

    def test_low_distal_amplitude_flags_axonal_loss(self):
        # MEDIAN/MOTOR min_distal_amplitude = 4.0 mV
        result = calculate_ncs(make_ncs(distal_amplitude=2.0))
        assert result.axonal_loss is True
        assert result.is_normal is False
        assert "axonal degeneration" in result.diagnostic_summary

    def test_prolonged_distal_latency_flags_demyelination(self):
        # MEDIAN/MOTOR max_distal_latency = 4.2ms, threshold = 4.2 * 1.3 = 5.46ms
        result = calculate_ncs(make_ncs(distal_latency_ms=6.0, distal_amplitude=5.0))
        assert result.demyelination is True
        assert result.axonal_loss is False
        assert result.is_normal is False

    def test_slow_conduction_velocity_flags_demyelination(self):
        # MEDIAN/MOTOR min_conduction_velocity = 50 m/s, threshold = 50 * 0.75 = 37.5 m/s
        result = calculate_ncs(
            make_ncs(
                distance_mm=100.0,
                distal_latency_ms=2.0,
                distal_amplitude=5.0,
                proximal_latency_ms=6.0,
                proximal_amplitude=4.8,
            )
        )
        assert result.conduction_velocity_m_per_s == pytest.approx(25.0)
        assert result.demyelination is True

    def test_large_amplitude_drop_flags_conduction_block(self):
        result = calculate_ncs(
            make_ncs(
                distance_mm=200.0,
                distal_latency_ms=3.0,
                distal_amplitude=10.0,
                distal_duration_ms=5.0,
                proximal_latency_ms=7.0,
                proximal_amplitude=4.0,
                proximal_duration_ms=6.0,
            )
        )
        assert result.amplitude_drop_percent == pytest.approx(60.0)
        assert result.conduction_block is True
        assert result.is_normal is False
        assert "focal conduction block" in result.diagnostic_summary

    def test_large_amplitude_drop_suppressed_by_temporal_dispersion(self):
        result = calculate_ncs(
            make_ncs(
                distance_mm=200.0,
                distal_latency_ms=3.0,
                distal_amplitude=10.0,
                distal_duration_ms=5.0,
                proximal_latency_ms=7.0,
                proximal_amplitude=4.0,
                proximal_duration_ms=10.0,
            )
        )
        assert result.amplitude_drop_percent == pytest.approx(60.0)
        assert result.temporal_dispersion_percent == pytest.approx(100.0)
        assert result.conduction_block is False

    def test_unknown_nerve_falls_back_to_generic_reference(self):
        result = calculate_ncs(make_ncs(nerve_name="RADIAL", distal_amplitude=2.0))
        # generic fallback min_distal_amplitude = 3.0
        assert result.axonal_loss is True

    def test_temperature_correction_changes_classification(self):
        # Raw distal latency (6.0ms) exceeds the demyelination threshold
        # (5.46ms), but a cold-limb correction brings it back to normal.
        without_correction = calculate_ncs(
            make_ncs(distal_latency_ms=6.0, distal_amplitude=5.0)
        )
        with_correction = calculate_ncs(
            make_ncs(
                distal_latency_ms=6.0,
                distal_amplitude=5.0,
                skin_temperature_celsius=17.0,
            )
        )
        assert without_correction.demyelination is True
        assert with_correction.demyelination is False
        assert with_correction.is_normal is True

    def test_normal_summary_text(self):
        result = calculate_ncs(
            make_ncs(nerve_name="SURAL", study_type=StudyType.SENSORY, distal_amplitude=10.0)
        )
        assert result.is_normal is True
        assert "Normal SENSORY conduction parameters for SURAL nerve" in result.diagnostic_summary

    def test_sensory_only_study_has_no_conduction_velocity(self):
        result = calculate_ncs(
            make_ncs(nerve_name="SURAL", study_type=StudyType.SENSORY, distal_amplitude=10.0)
        )
        assert result.conduction_velocity_m_per_s is None
        assert result.amplitude_drop_percent is None
        assert result.temporal_dispersion_percent is None
