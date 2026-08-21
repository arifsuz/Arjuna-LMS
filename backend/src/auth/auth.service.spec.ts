import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { PrismaService } from '../common/prisma';
import { Role } from '@prisma/client';

describe('AuthService Unit Test (Authentication & Security Layer)', () => {
  let service: AuthService;
  let prisma: any;
  let jwt: any;
  let config: any;

  const mockUser = {
    id: 'user-uuid-123',
    name: 'Admin LMS',
    email: 'admin@arjuna-lms.ac.id',
    passwordHash: '',
    role: Role.ADMIN,
    createdAt: new Date(),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await argon2.hash('admin123', {
      type: argon2.argon2id,
    });
  });

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const mockJwt = {
      signAsync: jest.fn().mockImplementation((payload, options) => {
        return Promise.resolve(`jwt_token_${options?.expiresIn || 'default'}`);
      }),
      verifyAsync: jest.fn(),
    };

    const mockConfig = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwt = module.get(JwtService);
    config = module.get(ConfigService);
  });

  it('TC-AUTH-001: Should login successfully with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    const result = await service.login({
      email: 'admin@arjuna-lms.ac.id',
      password: 'admin123',
    });

    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@arjuna-lms.ac.id' },
    });
  });

  it('TC-AUTH-002: Should throw UnauthorizedException when email does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'unknown@arjuna-lms.ac.id',
        password: 'admin123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('TC-AUTH-003: Should throw UnauthorizedException when password is wrong', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      service.login({
        email: 'admin@arjuna-lms.ac.id',
        password: 'wrongpassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('TC-AUTH-004: Should validate existing user by userId', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: mockUser.id,
      name: mockUser.name,
      email: mockUser.email,
      role: mockUser.role,
      createdAt: mockUser.createdAt,
    });

    const user = await service.validateUser(mockUser.id);
    expect(user.id).toBe(mockUser.id);
    expect(user.email).toBe(mockUser.email);
  });

  it('TC-AUTH-005: Should throw UnauthorizedException when validating non-existent userId', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.validateUser('invalid-id')).rejects.toThrow(UnauthorizedException);
  });

  it('TC-AUTH-006: Should generate valid Argon2id password hash', async () => {
    const plain = 'studentStrongPassword!2026';
    const hash = await service.hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash.startsWith('$argon2id$')).toBe(true);

    const isMatch = await argon2.verify(hash, plain);
    expect(isMatch).toBe(true);
  });
});
