import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { config } from 'src/config/config';
import { JwtUser } from './classes/jwt-user.class';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get().SECRET_KEY,
    });
  }

  async validate(payload: {
    id: number;
    email: string;
    role: { id: number; name: string };
  }): Promise<JwtUser> {
    const user = new JwtUser();
    user.id = payload.id;
    user.email = payload.email;
    user.role = payload.role;
    return user;
  }
}
