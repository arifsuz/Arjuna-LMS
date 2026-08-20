import {
  IsArray,
  ArrayMinSize,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}

export class BulkImportResultDto {
  created: number;
  skipped: number;
  errors: Array<{ row: number; email: string; reason: string }>;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class BulkDeleteUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];
}

export class BulkUpdateRoleDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(Role)
  role: Role;
}

export class BulkResetPasswordDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  userIds: string[];

  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class QueryUsersDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}
