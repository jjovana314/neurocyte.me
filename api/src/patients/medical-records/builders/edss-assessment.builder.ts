import { status as GrpcStatus } from '@grpc/grpc-js';
import { BadRequestException } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CalculatorServiceClient } from 'src/calculator-client/generated/calculator';
import { EdssAssessmentDataDto } from 'src/patients/dtos';
import { EdssAssesment } from 'src/patients/entities/edss-assesment.entity';
import { MedicalRecordBuilder } from './medical-record.builder';

export class EdssAssessmentBuild extends MedicalRecordBuilder<
  EdssAssessmentDataDto,
  EdssAssesment
> {
  constructor(private readonly calculatorService: CalculatorServiceClient) {
    super();
  }

  public async build(data: EdssAssessmentDataDto): Promise<EdssAssesment> {
    const ambulation = {
      unassistedWalkingDistanceMeters: data.unassistedWalkingDistanceMeters,
      requiresUnilateralAid: data.requiresUnilateralAid || false,
      requiresBilateralAid: data.requiresBilateralAid || false,
      wheelchairBound: data.wheelchairBound || false,
    };

    let totalScore: number;

    // todo: fix this, add error handler and parser for errors from other service
    try {
      const response = await firstValueFrom(
        this.calculatorService.calculateEdss({
          pyramidalSystem: data.pyramidalSystem,
          cerebellarSystem: data.cerebellarSystem,
          brainstemSystem: data.brainstemSystem,
          sensorySystem: data.sensorySystem,
          bowelBladderSystem: data.bowelBladderSystem,
          visualSystem: data.visualSystem,
          mentalSystem: data.mentalSystem,
          ...ambulation,
        }),
      );
      totalScore = response.totalScore;
    } catch (error: any) {
      if (error?.code === GrpcStatus.INVALID_ARGUMENT) {
        throw new BadRequestException(error.details);
      }
      throw error;
    }

    const assessment = new EdssAssesment();
    assessment.pyramidalSystem = data.pyramidalSystem;
    assessment.cerebellarSystem = data.cerebellarSystem;
    assessment.brainstemSystem = data.brainstemSystem;
    assessment.sensorySystem = data.sensorySystem;
    assessment.bowelBladderSystem = data.bowelBladderSystem;
    assessment.visualSystem = data.visualSystem;
    assessment.mentalSystem = data.mentalSystem;
    assessment.unassistedWalkingDistanceMeters =
      ambulation.unassistedWalkingDistanceMeters ?? null;
    assessment.requiresUnilateralAid = ambulation.requiresUnilateralAid;
    assessment.requiresBilateralAid = ambulation.requiresBilateralAid;
    assessment.wheelchairBound = ambulation.wheelchairBound;
    assessment.totalScore = totalScore;

    return assessment;
  }
}
