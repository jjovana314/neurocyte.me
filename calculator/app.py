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
