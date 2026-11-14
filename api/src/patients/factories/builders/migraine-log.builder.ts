import { CreateMigraineLogDto } from 'src/patients/dtos';
import { MedicalRecordBuilder } from './medical-record.builder';
import { MigraineLog } from 'src/patients/entities/migraine-log.entity';
import { dateValidation } from 'src/patients/utils/validation';
import { BadRequestException } from '@nestjs/common';

export class MigraineLogBuild extends MedicalRecordBuilder<
  Omit<CreateMigraineLogDto, 'patientId'>,
  MigraineLog
> {
  public async build(
    dto: Omit<CreateMigraineLogDto, 'patientId'>,
  ): Promise<MigraineLog> {
    const date = dateValidation(dto.occurredAt, 'occurredAt', true);
    if (
      dto.painSeverity == null ||
      !Number.isInteger(dto.painSeverity) ||
      dto.painSeverity < 1 ||
      dto.painSeverity > 10
    ) {
      throw new BadRequestException(
        'Pain severity is required and must be an integer between 1 and 10',
      );
    }

    const migraineLog = new MigraineLog();
    migraineLog.occurredAt = date;
    migraineLog.durationMinutes = dto.durationMinutes ?? null;
    migraineLog.painSeverity = dto.painSeverity;
    migraineLog.auraPresent = dto.auraPresent || false;
    migraineLog.triggers = dto.triggers || '';
    migraineLog.symptoms = dto.symptoms || '';
    migraineLog.medicationTaken = dto.medicationTaken || '';
    migraineLog.notes = dto.notes || '';

    return migraineLog;
  }
}
