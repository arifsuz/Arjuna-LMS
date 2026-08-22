import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MessageType } from '@prisma/client';

export class CreateThreadDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string; // The initial question body

  @IsOptional()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}

export class CreateMessageDto {
  @IsEnum(MessageType)
  type: MessageType;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsString()
  parentMessageId?: string;
}

export class QueryThreadsDto {
  @IsOptional()
  @IsString()
  status?: 'OPEN' | 'CLOSED';

  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
