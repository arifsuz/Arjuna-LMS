import { IsString, IsNotEmpty, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateOpinionDto {
  @IsOptional()
  @IsString()
  opinionText?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Positif', 'Negatif', 'Netral', ''])
  sentiment?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Happiness', 'Anger', 'Fear', 'Disgust', 'Sadness', 'Neutral', 'Supportive', ''])
  emotion?: string;

  @IsOptional()
  @IsString()
  targetStudentId?: string;
}
