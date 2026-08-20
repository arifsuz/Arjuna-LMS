import {
  IsOptional,
  IsNumber,
  IsString,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { LabelSource } from '@prisma/client';

export class CreateDatasetLabelDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  qaRelevance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  afRelevance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  feedbackNovelty?: number;

  @IsOptional()
  @IsString()
  studentSentiment?: string;

  @IsOptional()
  @IsString()
  studentEmotion?: string;

  @IsOptional()
  @IsString()
  lecturerSentiment?: string;

  @IsOptional()
  @IsString()
  lecturerEmotion?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  interactionQuality?: number;

  @IsOptional()
  @IsEnum(LabelSource)
  source?: LabelSource;
}

export class QueryDatasetExportDto {
  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  format?: 'csv' | 'json';
}
