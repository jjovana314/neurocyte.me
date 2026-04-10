import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    validateAndLogin: jest.fn(),
    register: jest.fn(),
    getRoles: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call authService.validateAndLogin on login', async () => {
    const loginDto = { email: 'test@example.com', password: 'password123' };
    const result = { accessToken: 'token', refreshToken: 'refresh' };

    mockAuthService.validateAndLogin.mockResolvedValue(result);
    await controller.login(loginDto);
    expect(mockAuthService.validateAndLogin).toHaveBeenCalledWith(
      loginDto.email,
      loginDto.password,
    );
  });
});
