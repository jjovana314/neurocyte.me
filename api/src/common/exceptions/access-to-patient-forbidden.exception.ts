import { ForbiddenException } from '@nestjs/common';

export class AccessToPatientForbiddenException extends ForbiddenException {
  constructor(
    message = 'You can only access data from patients who you added',
  ) {
    super(message);
  }
}
