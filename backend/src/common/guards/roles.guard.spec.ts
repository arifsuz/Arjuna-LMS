import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard Unit Test (Security & Authorization Layer)', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('TC-SEC-001: Should allow access when no roles decorator is defined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    const context = createMockContext({ id: 'user-1', role: Role.STUDENT });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('TC-SEC-002: Should allow ADMIN to access ADMIN-protected endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockContext({ id: 'admin-1', role: Role.ADMIN });
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('TC-SEC-003: Should reject STUDENT from accessing ADMIN-protected endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockContext({ id: 'mhs-1', role: Role.STUDENT });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('TC-SEC-004: Should reject LECTURER from accessing ADMIN-protected endpoints', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockContext({ id: 'dosen-1', role: Role.LECTURER });
    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('TC-SEC-005: Should allow LECTURER and ADMIN when both roles are authorized', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.LECTURER]);

    const contextLecturer = createMockContext({ id: 'dosen-1', role: Role.LECTURER });
    expect(guard.canActivate(contextLecturer)).toBe(true);

    const contextAdmin = createMockContext({ id: 'admin-1', role: Role.ADMIN });
    expect(guard.canActivate(contextAdmin)).toBe(true);
  });

  it('TC-SEC-006: Should reject request if user context is missing (unauthenticated)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.STUDENT]);

    const contextNoUser = createMockContext(null);
    expect(guard.canActivate(contextNoUser)).toBe(false);
  });
});
