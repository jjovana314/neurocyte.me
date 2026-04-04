import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PinoLogger } from 'nestjs-pino';
import { User } from './entites/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './entites/role.entity';
import { Action } from './entites/action.entity';

describe('AuthService (login & register)', () => {
  let service: AuthService;

  const mockUsersService = {
    findUserByEmail: jest.fn(),
    validateUser: jest.fn(),
    save: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockActionRepository = {
    find: jest.fn(),
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
        { provide: getRepositoryToken(Role), useValue: mockRoleRepository },
        { provide: getRepositoryToken(Action), useValue: mockActionRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('login should return accessToken and refreshToken', async () => {
    const user = { email: 'a@b.com', role: { name: 'user', actions: [] } } as any;
    mockJwtService.sign.mockReturnValue('signed-token');

    const result = await service.login(user);
    expect(result).toEqual({ accessToken: 'signed-token', refreshToken: 'signed-token' });
    expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('register should create user and return accessToken and refreshToken', async () => {
    const email = 'new@user.com';
    const password = 'password';
    const firstName = 'First';
    const lastName = 'Last';
    const roleName = 'doctor';
    const mockRole = { id: 1, name: 'doctor' } as any;

    mockUsersService.findUserByEmail.mockResolvedValue(null);
    mockRoleRepository.findOne.mockResolvedValue(mockRole);
    mockJwtService.sign.mockReturnValue('reg-token');

    // prevent actual hashing by stubbing the prototype method
    const hashSpy = jest.spyOn(User.prototype, 'hashPassword').mockImplementation(async () => {});

    mockUsersService.save.mockImplementation(async (u: any) => {
      u.id = 1;
      return u;
    });

    const result = await service.register(email, password, firstName, lastName, roleName);

    expect(mockUsersService.findUserByEmail).toHaveBeenCalledWith(email);
    expect(mockRoleRepository.findOne).toHaveBeenCalledWith({ where: { name: roleName } });
    expect(mockUsersService.save).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'reg-token', refreshToken: 'reg-token' });

    hashSpy.mockRestore();
  });
});
