import {
  Body,
  Controller,
  Get,
  Post,
  Query
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';

// todo: update all any parameters and requests

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() { email, password }: LoginDto) {
    return this.authService.validateAndLogin(email, password);
  }

  @Post('register')
  async register(
    @Body() { email, password, firstName, lastName, role }: RegisterDto,
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
