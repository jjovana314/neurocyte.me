import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MailService } from './mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Role } from 'src/auth/entites/role.entity';
import { LoggerModule } from 'nestjs-pino';
import { pinoHttpOptions } from 'src/logger/logger.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    LoggerModule.forRoot({ pinoHttp: pinoHttpOptions }),
  ],
  exports: [UserService],
  providers: [UserService, MailService],
  controllers: [UserController],
})
export class UserModule {}
