import { Test, TestingModule } from '@nestjs/testing';
import { AuthService, USER_ALREADY_EXISTS_MESSAGE } from './auth.service';
import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { PinoLogger } from 'nestjs-pino';
import { User } from 'src/user/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from './entites/role.entity';
import { Action } from './entites/action.entity';
import { RegisterDto } from './dtos/register.dto';

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
    const user = {
      email: 'a@b.com',
      role: { name: 'user', actions: [] },
    } as any;
    mockJwtService.sign.mockReturnValue('signed-token');

    const result = await service.login(user);
    expect(result).toEqual({
      accessToken: 'signed-token',
      refreshToken: 'signed-token',
    });
    expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
  });

  it('register should create user and return accessToken and refreshToken', async () => {
    const registerData: RegisterDto = {
      email: 'new@user.com',
      password: 'password',
      firstName: 'First',
      lastName: 'Last',
      role: 'Doctor',
    };

    mockUsersService.findUserByEmail.mockResolvedValue(null);
    mockRoleRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'Doctor',
    } as Role);
    mockJwtService.sign.mockReturnValue('reg-token');

    // prevent actual hashing by stubbing the prototype method
    const hashSpy = jest
      .spyOn(User.prototype, 'hashPassword')
      .mockImplementation(async () => {});

    mockUsersService.save.mockImplementation(async (u: any) => {
      u.id = 1;
      return u;
    });

    const result = await service.register(registerData);

    expect(mockUsersService.findUserByEmail).toHaveBeenCalledWith(
      registerData.email,
    );
    expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
      where: { name: registerData.role },
    });
    expect(mockUsersService.save).toHaveBeenCalled();
    expect(result).toEqual({
      accessToken: 'reg-token',
      refreshToken: 'reg-token',
    });

    hashSpy.mockRestore();
  });

  describe('register with an email that is already taken', () => {
    const registerData: RegisterDto = {
      email: 'taken@user.com',
      password: 'password',
      firstName: 'First',
      lastName: 'Last',
      role: 'Doctor',
    };

    it('throws ConflictException and neither creates the user nor logs in', async () => {
      mockUsersService.findUserByEmail.mockResolvedValue({
        id: 5,
        email: 'taken@user.com',
        role: { name: 'Support Engineer' },
      });

      await expect(service.register(registerData)).rejects.toThrow(
        new ConflictException(USER_ALREADY_EXISTS_MESSAGE),
      );
      expect(mockRoleRepository.findOne).not.toHaveBeenCalled();
      expect(mockUsersService.save).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('normalises the email before checking and saving it', async () => {
      mockUsersService.findUserByEmail.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({ id: 1, name: 'Doctor' });
      mockUsersService.save.mockImplementation(async (u: any) => ({
        ...u,
        id: 1,
      }));

      await service.register({ ...registerData, email: '  Taken@User.COM ' });

      expect(mockUsersService.findUserByEmail).toHaveBeenCalledWith(
        'taken@user.com',
      );
      expect(mockUsersService.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'taken@user.com' }),
      );
    });

    it('throws ConflictException when a concurrent insert hits the unique index', async () => {
      mockUsersService.findUserByEmail.mockResolvedValue(null);
      mockRoleRepository.findOne.mockResolvedValue({ id: 1, name: 'Doctor' });
      mockUsersService.save.mockRejectedValue(
        Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' }),
      );

      await expect(service.register(registerData)).rejects.toThrow(
        ConflictException,
      );
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });
});
