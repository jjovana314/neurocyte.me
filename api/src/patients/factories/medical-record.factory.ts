import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  CALCULATOR_SERVICE_NAME,
  CalculatorServiceClient,
} from 'src/calculator-client/generated/calculator';
import { EdssAssessmentBuild } from './builders/edss-assessment.builder';
import { SeizureLogBuild } from './builders/seizure-log.builder';
import { MigraineLogBuild } from './builders/migraine-log.builder';

export enum MedicalRecordType {
  SEIZURE_LOG = 1,
  NCS_STUDY = 2,
  EDSS_ASSESSMENT = 3,
  MIGRAINE_LOG = 4,
}

export interface MedicalRecordBuilderMap {
  [MedicalRecordType.SEIZURE_LOG]: SeizureLogBuild;
  [MedicalRecordType.EDSS_ASSESSMENT]: EdssAssessmentBuild;
  [MedicalRecordType.MIGRAINE_LOG]: MigraineLogBuild;
}

@Injectable()
export class MedicalRecordFactory implements OnModuleInit {
  private calculatorService: CalculatorServiceClient;
  constructor(
    @Inject('CALCULATOR_PACKAGE') private readonly calculatorClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.calculatorService =
      this.calculatorClient.getService<CalculatorServiceClient>(
        CALCULATOR_SERVICE_NAME,
      );
  }

  generateMedicalRecord<T extends keyof MedicalRecordBuilderMap>(
    type: T,
  ): MedicalRecordBuilderMap[T] {
    let builder: MedicalRecordBuilderMap[keyof MedicalRecordBuilderMap];
    switch (type) {
      case MedicalRecordType.EDSS_ASSESSMENT:
        builder = new EdssAssessmentBuild(this.calculatorService);
        break;
      case MedicalRecordType.SEIZURE_LOG:
        builder = new SeizureLogBuild();
        break;
      case MedicalRecordType.MIGRAINE_LOG:
        builder = new MigraineLogBuild();
        break;
      default:
        throw new Error(`Unsupported medical record type: ${String(type)}`);
    }
    return builder as MedicalRecordBuilderMap[T];
  }
}
