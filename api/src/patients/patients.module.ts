import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient } from './entities/patient.entity';
import { PatientHistory } from './entities/patient-history.entity';
import { FamilyHistory } from './entities/family-history.entity';
import { EdssAssesment } from './entities/edss-assesment.entity';
import { MigraineLog } from './entities/migraine-log.entity';
import { SeizureLog } from './entities/seizure-log.entity';
import { User } from 'src/auth/entites/user.entity';
import { UserModule } from 'src/user/user.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { config } from 'src/config/config';
import { CALCULATOR_PACKAGE_NAME } from 'src/calculator-client/generated/calculator';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      PatientHistory,
      FamilyHistory,
      EdssAssesment,
      MigraineLog,
      SeizureLog,
      User,
    ]),
    ClientsModule.register([
      {
        name: 'CALCULATOR_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: CALCULATOR_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'proto', 'calculator.proto'),
          url: config.get().CALCULATOR_GRPC_URL,
        },
      },
    ]),
    UserModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService, ClientsModule],
})
export class PatientsModule {}
