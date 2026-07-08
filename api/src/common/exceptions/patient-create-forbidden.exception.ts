import { ForbiddenException } from '@nestjs/common';

export class PatientCreateForbiddenException extends ForbiddenException {
  constructor(message = 'Only doctors can create patient records') {
    super(message);
  }
}
