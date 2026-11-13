import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import {
  CALCULATOR_SERVICE_NAME,
  CalculatorServiceClient,
} from 'src/calculator-client/generated/calculator';

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

  // async generateMedicalRecord(type: MedicalRecordType) {
  //   switch (type) {
  //     case MedicalRecordType.EDSS_ASSESSMENT:
  //     // return edss assesment build data
  //     case MedicalRecordType.SEIZURE_LOG:
  //     //
  //     case MedicalRecordType.NCS_STUDY:
  //     //
  //     case MedicalRecordType.MIGRAINE_LOG:
  //     //
  //   }
  // }
}

export enum MedicalRecordType {
  SEIZURE_LOG = 1,
  NCS_STUDY = 2,
  EDSS_ASSESSMENT = 3,
  MIGRAINE_LOG = 4,
}
