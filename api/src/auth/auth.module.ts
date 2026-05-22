import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { config } from 'src/config/config';
import { UserModule } from 'src/user/user.module';
import { LocalAuthGuard } from './local-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entites/user.entity';
import { Role } from './entites/role.entity';
import { Action } from './entites/action.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Role]),
    TypeOrmModule.forFeature([Action]),
    JwtModule.register({
      secret: config.get().SECRET_KEY,
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalAuthGuard, JwtStrategy],
})
export class AuthModule {}
