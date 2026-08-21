import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { MaterialType, MeetingPlatform } from '@prisma/client';

export class CreateModuleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number;
}

export class CreateMaterialDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(MaterialType)
  @IsOptional()
  type?: MaterialType;

  @IsString()
  @IsOptional()
  contentUrl?: string;

  @IsString()
  @IsOptional()
  textContent?: string;

  @IsInt()
  @IsOptional()
  durationMinutes?: number;

  @IsInt()
  @IsOptional()
  orderIndex?: number;
}

export class CreateVirtualMeetingDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(MeetingPlatform)
  @IsOptional()
  platform?: MeetingPlatform;

  @IsString()
  @IsNotEmpty()
  meetingUrl: string;

  @IsString()
  @IsOptional()
  passcode?: string;

  @IsString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsInt()
  @IsOptional()
  durationMinutes?: number;
}

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsString()
  @IsOptional()
  priority?: string; // "NORMAL" | "URGENT"
}

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  moduleId?: string;

  @IsString()
  @IsNotEmpty()
  dueDate: string;

  @IsNumber()
  @IsOptional()
  maxScore?: number;

  @IsNumber()
  @IsOptional()
  weightPercentage?: number;
}

export class SubmitAssignmentDto {
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  submittedText?: string;
}

export class GradeSubmissionDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;

  @IsString()
  @IsOptional()
  feedback?: string;
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  moduleId?: string;

  @IsInt()
  @IsOptional()
  durationMinutes?: number;

  @IsNumber()
  @IsOptional()
  passingScore?: number;

  @IsNumber()
  @IsOptional()
  weightPercentage?: number;

  @IsArray()
  @IsOptional()
  questions?: {
    questionText: string;
    questionType?: string;
    options?: string[];
    correctOptionIndex?: number;
    points?: number;
  }[];
}

export class SubmitQuizAttemptDto {
  @IsArray()
  answers: {
    questionId: string;
    selectedOptionIndex?: number;
    essayAnswer?: string;
  }[];
}

export class UpdateCourseSyllabusDto {
  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  syllabus?: string;
}
