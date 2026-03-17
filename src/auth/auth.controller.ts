import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
  Query
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { User } from './entites/user.entity';

// todo: update all any parameters and requests

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

  @Get('roles')
  async getRoles(@Query('name') name?: string, @Query('actions') actions?: string[]): Promise<any> {
    return await this.authService.getRoles(name, actions);
  }
}
