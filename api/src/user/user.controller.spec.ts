import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    remove: jest.fn(),
    requestDeactivation: jest.fn(),
    removeByToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates DELETE :id to userService.remove', async () => {
    const user = { id: 5 };
    mockUserService.remove.mockResolvedValue(user);

    await expect(controller.remove(5)).resolves.toBe(user);
    expect(mockUserService.remove).toHaveBeenCalledWith(5);
  });

  it('delegates POST :id/request-deactivation to userService.requestDeactivation', async () => {
    mockUserService.requestDeactivation.mockResolvedValue(undefined);

    await controller.requestDeactivation(8);

    expect(mockUserService.requestDeactivation).toHaveBeenCalledWith(8);
  });

  it('delegates GET deactivate/:token to userService.removeByToken', async () => {
    const user = { id: 2 };
    mockUserService.removeByToken.mockResolvedValue(user);

    await expect(controller.deactivateByToken('tok-123')).resolves.toBe(user);
    expect(mockUserService.removeByToken).toHaveBeenCalledWith('tok-123');
  });
});
