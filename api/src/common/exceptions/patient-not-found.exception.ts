import { NotFoundException } from '@nestjs/common';

export class PatientNotFoundException extends NotFoundException {
  constructor(patientId: number) {
    super(`Patient with ID ${patientId} not found`);
  }
}
