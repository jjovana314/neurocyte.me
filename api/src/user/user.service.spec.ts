import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/auth/entites/user.entity';
import { Role } from 'src/auth/entites/role.entity';
import { PinoLogger } from 'nestjs-pino';
import { MailService } from 'src/user/mail.service';

describe('UserService', () => {
  let service: UserService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockMailService = {
    sendEmail: jest.fn(),
  };

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
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

  it('should find user by email', async () => {
    const user = { email: 'test@example.com', id: 1 } as any;
    mockUserRepository.findOne.mockResolvedValue(user);

    const result = await service.findUserByEmail('test@example.com');
    expect(result).toEqual(user);
    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
    });
  });
});
