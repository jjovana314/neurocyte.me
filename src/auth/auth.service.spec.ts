import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PinoLogger } from 'nestjs-pino';
import { User } from './entites/user.entity';

describe('AuthService (login & register)', () => {
  let service: AuthService;

  const mockUsersService = {
    findUserByEmail: jest.fn(),
    validateUser: jest.fn(),
    save: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('login should return accessToken', async () => {
    const user = { email: 'a@b.com', role: { name: 'user', actions: [] } } as any;
    mockJwtService.sign.mockReturnValue('signed-token');

    const result = await service.login(user);
    expect(result).toEqual({ accessToken: 'signed-token' });
    expect(mockJwtService.sign).toHaveBeenCalledWith({ email: user.email, role: user.role });
  });

  it('register should create user and return accessToken', async () => {
    const email = 'new@user.com';
    const password = 'password';
    const firstName = 'First';
    const lastName = 'Last';
    const role = { name: 'user', actions: [] } as any;

    mockUsersService.findUserByEmail.mockResolvedValue(null);
    mockJwtService.sign.mockReturnValue('reg-token');

    // prevent actual hashing by stubbing the prototype method
    const hashSpy = jest.spyOn(User.prototype, 'hashPassword').mockImplementation(async () => {});

    mockUsersService.save.mockImplementation(async (u: any) => {
      u.id = 1;
      return u;
    });

    const result = await service.register(email, password, firstName, lastName, role as any);

    expect(mockUsersService.findUserByEmail).toHaveBeenCalledWith(email);
    expect(mockUsersService.save).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'reg-token' });

    hashSpy.mockRestore();
  });
});
