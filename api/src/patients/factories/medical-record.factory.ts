import { Injectable } from '@nestjs/common';

@Injectable()
export class MedicalRecordFactory {}

export enum MedicalRecordType {
  SEIZURE_LOG = 1,
  NCS_STUDY = 2,
  EDSS_ASSESSMENT = 3,
  MIGRAINE_LOG = 4,
}
