import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/auth/entites/user.entity';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
  providers: [UserService],
})
export class UserModule {}
