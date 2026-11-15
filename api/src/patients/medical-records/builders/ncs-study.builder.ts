import { NcsStudy, NcsStudyType } from 'src/patients/entities/ncs-study.entity';
import { MedicalRecordBuilder } from './medical-record.builder';
import { CreateNcsStudyDto } from 'src/patients/dtos';
import { BadRequestException } from '@nestjs/common';
import { status as GrpcStatus } from '@grpc/grpc-js';
import {
  CalculatorServiceClient,
  NcsResponse,
  StudyType,
} from 'src/calculator-client/generated/calculator';
import { firstValueFrom } from 'rxjs';

export class NcsStudyBuild extends MedicalRecordBuilder<
  Omit<CreateNcsStudyDto, 'patientId'>,
  NcsStudy
> {
  constructor(private readonly calculatorService: CalculatorServiceClient) {
    super();
  }

  public async build(
    dto: Omit<CreateNcsStudyDto, 'patientId'>,
  ): Promise<NcsStudy> {
    const grpcStudyType =
      dto.studyType === NcsStudyType.MOTOR
        ? StudyType.MOTOR
        : StudyType.SENSORY;

    let response: NcsResponse;

    // todo: fix this, add error handler and parser for errors from other service
    try {
      response = await firstValueFrom(
        this.calculatorService.calculateNcs({
          nerveName: dto.nerveName,
          studyType: grpcStudyType,
          distanceMm: dto.distanceMm,
          distalSite: {
            latencyMs: dto.distalSite.latencyMs,
            amplitude: dto.distalSite.amplitude,
            durationMs: dto.distalSite.durationMs,
          },
          proximalSite: dto.proximalSite
            ? {
                latencyMs: dto.proximalSite.latencyMs,
                amplitude: dto.proximalSite.amplitude,
                durationMs: dto.proximalSite.durationMs,
              }
            : undefined,
          skinTemperatureCelsius: dto.skinTemperatureCelsius,
        }),
      );
    } catch (error: any) {
      if (error?.code === GrpcStatus.INVALID_ARGUMENT) {
        throw new BadRequestException(error.details);
      }
      throw error;
    }

    const ncsStudy = new NcsStudy();
    ncsStudy.nerveName = dto.nerveName;
    ncsStudy.studyType = dto.studyType;
    ncsStudy.distanceMm = dto.distanceMm;
    ncsStudy.distalLatencyMs = dto.distalSite.latencyMs;
    ncsStudy.distalAmplitude = dto.distalSite.amplitude;
    ncsStudy.distalDurationMs = dto.distalSite.durationMs ?? null;
    ncsStudy.proximalLatencyMs = dto.proximalSite?.latencyMs ?? null;
    ncsStudy.proximalAmplitude = dto.proximalSite?.amplitude ?? null;
    ncsStudy.proximalDurationMs = dto.proximalSite?.durationMs ?? null;
    ncsStudy.skinTemperatureCelsius = dto.skinTemperatureCelsius ?? null;
    ncsStudy.conductionVelocityMPerS = response.conductionVelocityMPerS ?? null;
    ncsStudy.amplitudeDropPercent = response.amplitudeDropPercent ?? null;
    ncsStudy.temporalDispersionPercent =
      response.temporalDispersionPercent ?? null;
    ncsStudy.isNormal = response.isNormal;
    ncsStudy.axonalLoss = response.axonalLoss;
    ncsStudy.demyelination = response.demyelination;
    ncsStudy.conductionBlock = response.conductionBlock;
    ncsStudy.diagnosticSummary = response.diagnosticSummary;

    return ncsStudy;
  }
}
