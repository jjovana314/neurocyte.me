import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { MessageResponseDto } from './dtos/message-response.dto';

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
    @Body() registerData: RegisterDto,
  ): Promise<{ accessToken: string }> {
    return await this.authService.register(registerData);
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(
    @Body() { email }: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    await this.authService.forgotPassword(email);
    return { message: 'If that email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(
    @Body() { token, newPassword }: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    await this.authService.resetPassword(token, newPassword);
    return { message: 'Password reset successfully.' };
  }

  @Get('roles')
  async getRoles(
    @Query('name') name?: string,
    @Query('actions') actions?: string[],
  ): Promise<any> {
    return await this.authService.getRoles(name, actions);
  }
}
