import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserService } from 'src/user/user.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockUserService = {
    findUserById: jest.fn(),
  };

  const makeContext = (jwtUser: unknown): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ user: jwtUser }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new RolesGuard(
      mockReflector as unknown as Reflector,
      mockUserService as unknown as UserService,
    );
  });

  it('allows access when the route has no required roles', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    const result = await guard.canActivate(makeContext({ id: 1 }));

    expect(result).toBe(true);
    expect(mockUserService.findUserById).not.toHaveBeenCalled();
  });

  it('allows access when the required roles list is empty', async () => {
    mockReflector.getAllAndOverride.mockReturnValue([]);

    const result = await guard.canActivate(makeContext({ id: 1 }));

    expect(result).toBe(true);
  });

  it('throws ForbiddenException when there is no authenticated user on the request', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);

    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(
      new ForbiddenException('User not authenticated'),
    );
    expect(mockUserService.findUserById).not.toHaveBeenCalled();
  });

  it('throws ForbiddenException when the authenticated user no longer exists', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    mockUserService.findUserById.mockResolvedValue(null);

    await expect(guard.canActivate(makeContext({ id: 1 }))).rejects.toThrow(
      new ForbiddenException('User not found'),
    );
  });

  it('throws ForbiddenException when the user role is not in the required roles', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    mockUserService.findUserById.mockResolvedValue({
      id: 1,
      role: { name: 'Doctor' },
    });

    await expect(guard.canActivate(makeContext({ id: 1 }))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws ForbiddenException when the user has no role assigned', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    mockUserService.findUserById.mockResolvedValue({ id: 1, role: null });

    await expect(guard.canActivate(makeContext({ id: 1 }))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows access when the user role matches a required role', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    mockUserService.findUserById.mockResolvedValue({
      id: 1,
      role: { name: 'admin' },
    });

    const result = await guard.canActivate(makeContext({ id: 1 }));

    expect(result).toBe(true);
  });

  it('matches roles case-insensitively', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['Doctor', 'Researcher']);
    mockUserService.findUserById.mockResolvedValue({
      id: 1,
      role: { name: 'doctor' },
    });

    const result = await guard.canActivate(makeContext({ id: 1 }));

    expect(result).toBe(true);
  });

  it('looks up the user by the id from the JWT payload', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(['admin']);
    mockUserService.findUserById.mockResolvedValue({
      id: 42,
      role: { name: 'admin' },
    });

    await guard.canActivate(makeContext({ id: 42 }));

    expect(mockUserService.findUserById).toHaveBeenCalledWith(42);
  });
});
