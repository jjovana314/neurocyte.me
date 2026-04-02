import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailService } from './mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entites/user.entity';
import { Role } from 'src/auth/entites/role.entity';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    LoggerModule.forRoot({
      pinoHttp: {
        useLevel: 'info',
        serializers: {
          timestamp: () => {
            `time: ${new Date(Date.now()).toISOString()}`;
          },
        },
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: `dd.mm.yyyy, HH:MM:ss`,
            ignore: 'pid,hostname',
          },
        },
        autoLogging: false,
      },
    }),
  ],
  exports: [UserService],
  providers: [UserService, MailService],
  controllers: [UserController],
})
export class UserModule {}
