import { BadRequestException } from '@nestjs/common';
import { CreateSeizureLogDto } from 'src/patients/dtos';
import { SeizureLog } from 'src/patients/entities/seizure-log.entity';
import {
  MotorFeature,
  OnsetVector,
  SeizureTrigger,
} from 'src/patients/enums/seizureEnums';
import { MedicalRecordBuilder } from './medical-record.builder';

export class SeizureLogBuild extends MedicalRecordBuilder<
  Omit<CreateSeizureLogDto, 'patientId'>,
  SeizureLog
> {
  public async build(
    seizureData: Omit<CreateSeizureLogDto, 'patientId'>,
  ): Promise<SeizureLog> {
    if (!Object.values(OnsetVector).includes(seizureData.onsetVector)) {
      throw new BadRequestException(
        'onsetVector is required and must be one of FOCAL_AWARE, FOCAL_IMPAIRED_AWARENESS, GENERALIZED',
      );
    }
    if (!seizureData.ictusStart || !seizureData.ictusEnd) {
      throw new BadRequestException('ictußsStart and ictusEnd are required');
    }

    const ictusStart = new Date(seizureData.ictusStart);
    const ictusEnd = new Date(seizureData.ictusEnd);
    if (
      Number.isNaN(ictusStart.getTime()) ||
      Number.isNaN(ictusEnd.getTime())
    ) {
      throw new BadRequestException(
        'ictusStart and ictusEnd must be valid dates',
      );
    }
    if (ictusStart.getTime() > Date.now() || ictusEnd.getTime() > Date.now()) {
      throw new BadRequestException(
        'ictusStart and ictusEnd cannot be in the future',
      );
    }
    if (ictusEnd.getTime() < ictusStart.getTime()) {
      throw new BadRequestException('ictusEnd must not be before ictusStart');
    }

    const motorFeatures = seizureData.motorFeatures || [];
    if (motorFeatures.some((f) => !Object.values(MotorFeature).includes(f))) {
      throw new BadRequestException(
        'motorFeatures may only contain TONIC, CLONIC, ATONIC, AUTOMATISMS',
      );
    }

    const triggers = seizureData.triggers || [];
    if (triggers.some((t) => !Object.values(SeizureTrigger).includes(t))) {
      throw new BadRequestException(
        'triggers may only contain SLEEP_DEPRIVATION, MISSED_DOSE, HIGH_STRESS, ILLNESS',
      );
    }

    if (
      seizureData.postictalDurationMinutes != null &&
      (!Number.isInteger(seizureData.postictalDurationMinutes) ||
        seizureData.postictalDurationMinutes < 0)
    ) {
      throw new BadRequestException(
        'postictalDurationMinutes must be a non-negative integer',
      );
    }

    const seizureLog = new SeizureLog();
    seizureLog.onsetVector = seizureData.onsetVector;
    seizureLog.motorFeatures = motorFeatures;
    seizureLog.ictusStart = ictusStart;
    seizureLog.ictusEnd = ictusEnd;
    seizureLog.ictusDurationSeconds = Math.round(
      (ictusEnd.getTime() - ictusStart.getTime()) / 1000,
    );
    seizureLog.postictalDurationMinutes =
      seizureData.postictalDurationMinutes ?? null;
    seizureLog.triggers = triggers;
    seizureLog.notes = seizureData.notes || '';

    return seizureLog;
  }
}
