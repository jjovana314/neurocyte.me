import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { User } from './entites/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(
    @Body() { email, password, firstName, lastName, role }: User,
  ): Promise<{ accessToken: string }> {
    return await this.authService.register(
      email,
      password,
      firstName,
      lastName,
      role,
    );
  }
}
