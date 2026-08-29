import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Role } from 'src/auth/entites/role.entity';
import { PinoLogger } from 'nestjs-pino';
import { MailService } from 'src/user/mail.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomUUID: jest.fn(() => 'fixed-uuid'),
}));

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
    sendDeactivationEmail: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Role), useValue: mockRoleRepository },
        { provide: MailService, useValue: mockMailService },
        { provide: PinoLogger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findUserByEmail', () => {
    it('looks the user up by email', async () => {
      const user = { email: 'test@example.com', id: 1 } as User;
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await service.findUserByEmail('test@example.com');

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('findUserById', () => {
    it('looks the user up by id', async () => {
      const user = { id: 7 } as User;
      mockUserRepository.findOne.mockResolvedValue(user);

      expect(await service.findUserById(7)).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
    });
  });

  describe('validateUser', () => {
    it('returns null and logs when no user matches the email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      expect(await service.validateUser('nobody@example.com', 'pw')).toBeNull();
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('returns null when the password does not match', async () => {
      mockUserRepository.findOne.mockResolvedValue({ email: 'a@b.c', password: 'hash' } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      expect(await service.validateUser('a@b.c', 'wrong')).toBeNull();
    });

    it('returns the user when the password matches', async () => {
      const user = { email: 'a@b.c', password: 'hash' } as User;
      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      expect(await service.validateUser('a@b.c', 'right')).toBe(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'a@b.c' },
        relations: ['role'],
      });
    });
  });

  describe('save', () => {
    it('creates and persists the entity', async () => {
      const input = { email: 'new@example.com' } as User;
      const created = { ...input, id: 1 } as User;
      mockUserRepository.create.mockReturnValue(created);
      mockUserRepository.save.mockResolvedValue(created);

      expect(await service.save(input)).toBe(created);
      expect(mockUserRepository.create).toHaveBeenCalledWith(input);
      expect(mockUserRepository.save).toHaveBeenCalledWith(created);
    });
  });

  describe('remove', () => {
    it('removes an existing user', async () => {
      const user = { id: 3 } as User;
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.remove.mockResolvedValue(user);

      expect(await service.remove(3)).toBe(user);
      expect(mockUserRepository.remove).toHaveBeenCalledWith(user);
    });

    it('throws NotFoundException when the user is missing', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('requestDeactivation', () => {
    it('throws NotFoundException when the user is missing', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.requestDeactivation(1)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('stores a token and emails every admin a deactivation link', async () => {
      const user = { id: 1, firstName: 'Ada', lastName: 'Byron', email: 'ada@x.io' } as User;
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.find.mockResolvedValue([
        { email: 'admin1@x.io' },
        { email: 'admin2@x.io' },
      ] as User[]);

      await service.requestDeactivation(1);

      expect(user.deactivationToken).toBe('fixed-uuid');
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
      expect(mockMailService.sendDeactivationEmail).toHaveBeenCalledTimes(2);
      expect(mockMailService.sendDeactivationEmail).toHaveBeenCalledWith(
        'admin1@x.io',
        expect.stringContaining('/user/deactivate/fixed-uuid'),
        'Ada Byron',
      );
    });
  });

  describe('removeByToken', () => {
    it('removes the user matching the deactivation token', async () => {
      const user = { id: 4, deactivationToken: 'fixed-uuid' } as User;
      mockUserRepository.findOne.mockResolvedValue(user);
      mockUserRepository.remove.mockResolvedValue(user);

      expect(await service.removeByToken('fixed-uuid')).toBe(user);
    });

    it('throws NotFoundException for an unknown token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.removeByToken('nope')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('sendPasswordReset', () => {
    it('does nothing (and does not throw) for an unknown email', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await service.sendPasswordReset('ghost@example.com');

      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('stores a token with a 1-hour expiry and emails the reset link', async () => {
      const user = { firstName: 'Grace', lastName: 'Hopper', email: 'grace@x.io' } as User;
      mockUserRepository.findOne.mockResolvedValue(user);
      const before = Date.now();

      await service.sendPasswordReset('grace@x.io');

      expect(user.resetPasswordToken).toBe('fixed-uuid');
      expect(user.resetPasswordExpires!.getTime()).toBeGreaterThanOrEqual(before + 59 * 60 * 1000);
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'grace@x.io',
        expect.stringContaining('token=fixed-uuid'),
        'Grace Hopper',
      );
    });
  });

  describe('resetPassword', () => {
    it('rejects an unknown token', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.resetPassword('bad', 'pw')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an expired token', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        resetPasswordToken: 'fixed-uuid',
        resetPasswordExpires: new Date(Date.now() - 1000),
      } as User);

      await expect(service.resetPassword('fixed-uuid', 'pw')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('hashes the new password and clears the reset fields', async () => {
      const user = {
        resetPasswordToken: 'fixed-uuid',
        resetPasswordExpires: new Date(Date.now() + 60_000),
      } as User;
      mockUserRepository.findOne.mockResolvedValue(user);
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

      await service.resetPassword('fixed-uuid', 'new-password');

      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 'salt');
      expect(user.password).toBe('hashed-pw');
      expect(user.resetPasswordToken).toBeNull();
      expect(user.resetPasswordExpires).toBeNull();
      expect(mockUserRepository.save).toHaveBeenCalledWith(user);
    });
  });
});
