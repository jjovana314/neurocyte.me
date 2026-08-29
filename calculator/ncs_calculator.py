from __future__ import annotations
from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional


class InvalidActionPotentialError(ValueError):
    """Raised when electrophysiological parameters fail physiological validation."""
    pass


class StudyType(Enum):
    MOTOR = "MOTOR"
    SENSORY = "SENSORY"


@dataclass
class NcsSegmentMeasurement:
    latency_ms: float
    amplitude: float  # mV for Motor (CMAP), uV for Sensory (SNAP)
    duration_ms: Optional[float] = None


@dataclass
class NcsInput:
    nerve_name: str
    study_type: StudyType
    distance_mm: float
    distal_site: NcsSegmentMeasurement
    proximal_site: Optional[NcsSegmentMeasurement] = None
    skin_temperature_celsius: Optional[float] = None


@dataclass
class NerveReferenceValues:
    min_conduction_velocity_m_per_s: float  # Lower Limit of Normal (LLN)
    max_distal_latency_ms: float       # Upper Limit of Normal (ULN)
    min_distal_amplitude: float        # LLN (mV or uV)


@dataclass
class NcsResult:
    nerve_name: str
    conduction_velocity_m_per_s: Optional[float]
    amplitude_drop_percent: Optional[float]
    temporal_dispersion_percent: Optional[float]
    is_normal: bool
    axonal_loss: bool
    demyelination: bool
    conduction_block: bool
    diagnostic_summary: str


# Reference normative values for standard peripheral nerves (Adults)
DEFAULT_NORMATIVE_RANGES: Dict[str, Dict[StudyType, NerveReferenceValues]] = {
    "MEDIAN": {
        StudyType.MOTOR: NerveReferenceValues(
            min_conduction_velocity_m_per_s=50.0,
            max_distal_latency_ms=4.2,
            min_distal_amplitude=4.0  # mV
        ),
        StudyType.SENSORY: NerveReferenceValues(
            min_conduction_velocity_m_per_s=48.0,
            max_distal_latency_ms=3.5,
            min_distal_amplitude=15.0  # uV
        ),
    },
    "ULNAR": {
        StudyType.MOTOR: NerveReferenceValues(
            min_conduction_velocity_m_per_s=50.0,
            max_distal_latency_ms=3.5,
            min_distal_amplitude=5.0  # mV
        ),
        StudyType.SENSORY: NerveReferenceValues(
            min_conduction_velocity_m_per_s=50.0,
            max_distal_latency_ms=3.1,
            min_distal_amplitude=10.0  # uV
        ),
    },
    "PERONEAL": {
        StudyType.MOTOR: NerveReferenceValues(
            min_conduction_velocity_m_per_s=40.0,
            max_distal_latency_ms=6.0,
            min_distal_amplitude=2.0  # mV
        ),
    },
    "SURAL": {
        StudyType.SENSORY: NerveReferenceValues(
            min_conduction_velocity_m_per_s=40.0,
            max_distal_latency_ms=4.2,
            min_distal_amplitude=6.0  # uV
        ),
    },
}


def _validate_ncs_input(ncs: NcsInput) -> None:
    if ncs.distance_mm <= 0:
        raise InvalidActionPotentialError("Conduction distance_mm must be strictly positive.")

    if ncs.distal_site.latency_ms <= 0 or ncs.distal_site.amplitude < 0:
        raise InvalidActionPotentialError("Distal site latency must be positive and amplitude non-negative.")

    if ncs.distal_site.duration_ms is not None and ncs.distal_site.duration_ms < 0:
        raise InvalidActionPotentialError("Distal site duration_ms must be non-negative.")

    if ncs.proximal_site:
        if ncs.proximal_site.latency_ms <= 0 or ncs.proximal_site.amplitude < 0:
            raise InvalidActionPotentialError("Proximal site latency must be positive and amplitude non-negative.")

        if ncs.proximal_site.duration_ms is not None and ncs.proximal_site.duration_ms < 0:
            raise InvalidActionPotentialError("Proximal site duration_ms must be non-negative.")

        if ncs.proximal_site.latency_ms <= ncs.distal_site.latency_ms:
            raise InvalidActionPotentialError(
                f"Proximal latency ({ncs.proximal_site.latency_ms} ms) must be greater than "
                f"distal latency ({ncs.distal_site.latency_ms} ms)."
            )


def _apply_temperature_correction(ncs: NcsInput) -> NcsInput:
    """
    Cold limbs slow down nerve signals (~5% slowing or ~1.5 m/s drop per C below 32 C).
    Normalizes distal latency if skin temperature < 32 C.
    """
    if ncs.skin_temperature_celsius is None or ncs.skin_temperature_celsius >= 32.0:
        return ncs

    temp_diff = 32.0 - ncs.skin_temperature_celsius
    # Correct distal latency: ~0.2 ms deduction per  C below 32 C
    corrected_distal_latency = max(0.1, ncs.distal_site.latency_ms - (0.2 * temp_diff))

    corrected_distal = NcsSegmentMeasurement(
        latency_ms=corrected_distal_latency,
        amplitude=ncs.distal_site.amplitude,
        duration_ms=ncs.distal_site.duration_ms,
    )

    corrected_proximal = None
    if ncs.proximal_site:
        corrected_proximal_latency = max(0.1, ncs.proximal_site.latency_ms - (0.2 * temp_diff))
        corrected_proximal = NcsSegmentMeasurement(
            latency_ms=corrected_proximal_latency,
            amplitude=ncs.proximal_site.amplitude,
            duration_ms=ncs.proximal_site.duration_ms,
        )

    return NcsInput(
        nerve_name=ncs.nerve_name,
        study_type=ncs.study_type,
        distance_mm=ncs.distance_mm,
        distal_site=corrected_distal,
        proximal_site=corrected_proximal,
        skin_temperature_celsius=ncs.skin_temperature_celsius,
    )


def _calculate_conduction_velocity(distance_mm: float, proximal_latency_ms: float, distal_latency_ms: float) -> float:
    """
    Velocity = Distance (mm) / Delta Latency (ms)
    mm / ms evaluates directly to meters per second (m/s).
    """
    delta_latency = proximal_latency_ms - distal_latency_ms
    return round(distance_mm / delta_latency, 2)


def _calculate_amplitude_drop(distal_amp: float, proximal_amp: float) -> float:
    if distal_amp == 0:
        return 0.0
    drop = ((distal_amp - proximal_amp) / distal_amp) * 100.0
    return round(max(0.0, drop), 2)


def _calculate_temporal_dispersion(distal_duration_ms: Optional[float], proximal_duration_ms: Optional[float]) -> Optional[float]:
    if not distal_duration_ms or not proximal_duration_ms or distal_duration_ms == 0:
        return None
    dispersion = ((proximal_duration_ms - distal_duration_ms) / distal_duration_ms) * 100.0
    return round(max(0.0, dispersion), 2)


def calculate_ncs(ncs: NcsInput) -> NcsResult:
    """
    Main entry point for processing Nerve Conduction Study (NCS) data.
    """
    _validate_ncs_input(ncs)
    normalized_ncs = _apply_temperature_correction(ncs)

    conduction_velocity: Optional[float] = None
    amplitude_drop: Optional[float] = None
    temporal_dispersion: Optional[float] = None

    if normalized_ncs.proximal_site:
        conduction_velocity = _calculate_conduction_velocity(
            distance_mm=normalized_ncs.distance_mm,
            proximal_latency_ms=normalized_ncs.proximal_site.latency_ms,
            distal_latency_ms=normalized_ncs.distal_site.latency_ms,
        )
        amplitude_drop = _calculate_amplitude_drop(
            distal_amp=normalized_ncs.distal_site.amplitude,
            proximal_amp=normalized_ncs.proximal_site.amplitude,
        )
        temporal_dispersion = _calculate_temporal_dispersion(
            distal_duration_ms=normalized_ncs.distal_site.duration_ms,
            proximal_duration_ms=normalized_ncs.proximal_site.duration_ms,
        )

    # Fetch reference limits (fallback to generic defaults if unknown nerve name)
    nerve_key = normalized_ncs.nerve_name.upper()
    reference = DEFAULT_NORMATIVE_RANGES.get(nerve_key, {}).get(
        normalized_ncs.study_type,
        NerveReferenceValues(min_conduction_velocity_m_per_s=45.0, max_distal_latency_ms=4.0, min_distal_amplitude=3.0)
    )

    # Diagnostic Classification Flags
    axonal_loss = normalized_ncs.distal_site.amplitude < reference.min_distal_amplitude

    demyelination = (
        normalized_ncs.distal_site.latency_ms > (reference.max_distal_latency_ms * 1.3)
        or (conduction_velocity is not None and conduction_velocity < (reference.min_conduction_velocity_m_per_s * 0.75))
    )

    conduction_block = False
    if amplitude_drop is not None and amplitude_drop >= 50.0:
        # Conduction block requires >50% drop without excessive temporal dispersion (<30%)
        if temporal_dispersion is None or temporal_dispersion < 30.0:
            conduction_block = True

    is_normal = not (axonal_loss or demyelination or conduction_block)

    # Generate Clinical Text Summary
    if is_normal:
        summary = f"Normal {normalized_ncs.study_type.value} conduction parameters for {normalized_ncs.nerve_name} nerve."
    else:
        findings = []
        if demyelination:
            findings.append("demyelinating slowing/prolonged latency")
        if axonal_loss:
            findings.append("reduced amplitude (axonal degeneration)")
        if conduction_block:
            findings.append("focal conduction block")
        summary = f"Abnormal {normalized_ncs.study_type.value} study of {normalized_ncs.nerve_name} nerve: Evidence of " + ", ".join(findings) + "."

    return NcsResult(
        nerve_name=normalized_ncs.nerve_name,
        conduction_velocity_m_per_s=conduction_velocity,
        amplitude_drop_percent=amplitude_drop,
        temporal_dispersion_percent=temporal_dispersion,
        is_normal=is_normal,
        axonal_loss=axonal_loss,
        demyelination=demyelination,
        conduction_block=conduction_block,
        diagnostic_summary=summary,
    )