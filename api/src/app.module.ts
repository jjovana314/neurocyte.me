import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { config } from 'src/config/config';
import { PatientsModule } from './patients/patients.module';
import { PdfExportModule } from './patients/pdf-export/pdf-export.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    PatientsModule,
    PdfExportModule,
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: config.get().DATABASE_URL,
      port: Number(config.get().DATABASE_PORT),
      username: config.get().DATABASE_USERNAME,
      password: config.get().DATABASE_PASSWORD,
      database: config.get().DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
