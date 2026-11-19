import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../entities/patient.entity';
import { PatientHistory } from '../entities/patient-history.entity';
import { FamilyHistory } from '../entities/family-history.entity';
import { SeizureLog } from '../entities/seizure-log.entity';
import { TouretteSyndrome } from '../entities/tourette-syndrome.entity';
import { User } from 'src/user/entities/user.entity';
import { UserModule } from 'src/user/user.module';
import { PdfExportController } from './pdf-export.controller';
import { PatientPdfExportService } from './patient-pdf-export.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      PatientHistory,
      FamilyHistory,
      SeizureLog,
      TouretteSyndrome,
      User,
    ]),
    // RolesGuard depends on UserService
    UserModule,
  ],
  controllers: [PdfExportController],
  providers: [PatientPdfExportService],
})
export class PdfExportModule {}
