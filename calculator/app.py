import logging
import os
from concurrent import futures

import grpc

from edss_calculator import (
    EdssAmbulationMetrics,
    EdssFunctionalScores,
    InvalidFunctionalScoreError,
    calculate_edss_score,
)
from ncs_calculator import (
    InvalidActionPotentialError,
    NcsInput,
    NcsSegmentMeasurement,
    StudyType,
    calculate_ncs,
)
from generated import calculator_pb2, calculator_pb2_grpc

logger = logging.getLogger(__name__)


class CalculatorServicer(calculator_pb2_grpc.CalculatorServiceServicer):
    def CalculateEdss(self, request, context):
        scores = EdssFunctionalScores(
            pyramidal_system=request.pyramidal_system,
            cerebellar_system=request.cerebellar_system,
            brainstem_system=request.brainstem_system,
            sensory_system=request.sensory_system,
            bowel_bladder_system=request.bowel_bladder_system,
            visual_system=request.visual_system,
            mental_system=request.mental_system,
        )
        ambulation = EdssAmbulationMetrics(
            unassisted_walking_distance_meters=(
                request.unassisted_walking_distance_meters
                if request.HasField("unassisted_walking_distance_meters")
                else None
            ),
            requires_unilateral_aid=request.requires_unilateral_aid,
            requires_bilateral_aid=request.requires_bilateral_aid,
            wheelchair_bound=request.wheelchair_bound,
        )

        try:
            total_score = calculate_edss_score(scores, ambulation)
        except InvalidFunctionalScoreError as exc:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(exc))
            return

        return calculator_pb2.EdssResponse(total_score=total_score)

    def CalculateNcs(self, request, context):
        study_type = {
            calculator_pb2.MOTOR: StudyType.MOTOR,
            calculator_pb2.SENSORY: StudyType.SENSORY,
        }.get(request.study_type)
        if study_type is None:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT,
                "study_type must be MOTOR or SENSORY",
            )
            return

        def to_segment(segment) -> NcsSegmentMeasurement:
            return NcsSegmentMeasurement(
                latency_ms=segment.latency_ms,
                amplitude=segment.amplitude,
                duration_ms=(
                    segment.duration_ms if segment.HasField("duration_ms") else None
                ),
            )

        ncs_input = NcsInput(
            nerve_name=request.nerve_name,
            study_type=study_type,
            distance_mm=request.distance_mm,
            distal_site=to_segment(request.distal_site),
            proximal_site=(
                to_segment(request.proximal_site)
                if request.HasField("proximal_site")
                else None
            ),
            skin_temperature_celsius=(
                request.skin_temperature_celsius
                if request.HasField("skin_temperature_celsius")
                else None
            ),
        )

        try:
            result = calculate_ncs(ncs_input)
        except InvalidActionPotentialError as exc:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, str(exc))
            return

        return calculator_pb2.NcsResponse(
            nerve_name=result.nerve_name,
            conduction_velocity_m_per_s=result.conduction_velocity_m_per_s,
            amplitude_drop_percent=result.amplitude_drop_percent,
            temporal_dispersion_percent=result.temporal_dispersion_percent,
            is_normal=result.is_normal,
            axonal_loss=result.axonal_loss,
            demyelination=result.demyelination,
            conduction_block=result.conduction_block,
            diagnostic_summary=result.diagnostic_summary,
        )


def serve() -> None:
    port = os.environ.get("CALCULATOR_GRPC_PORT", "50051")
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    calculator_pb2_grpc.add_CalculatorServiceServicer_to_server(
        CalculatorServicer(), server
    )
    server.add_insecure_port(f"[::]:{port}")
    server.start()
    logger.info("Calculator gRPC server listening on port %s", port)
    server.wait_for_termination()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    serve()
