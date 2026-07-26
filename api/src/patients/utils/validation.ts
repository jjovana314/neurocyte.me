import { BadRequestException } from "@nestjs/common";

export function dateValidation(strDate: string, fieldName: string, required=false): Date {
    if (required && !strDate) {
      throw new BadRequestException(`${fieldName} is required`);
    }
    const date = new Date(strDate);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date`);
    }
    if (date.getTime() > Date.now()) {
      throw new BadRequestException(`${fieldName} cannot be in the future`);
    }
    return date;
}