import { IsString, IsNotEmpty, MinLength, IsOptional, IsIn } from 'class-validator';

export class CreateOpinionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Opini minimal berisi 3 karakter' })
  opinionText: string;

  @IsOptional()
  @IsString()
  @IsIn(['Positif', 'Negatif'])
  sentiment?: string;

  @IsOptional()
  @IsString()
  @IsIn(['Happiness', 'Anger', 'Fear', 'Disgust', 'Sadness'])
  emotion?: string;
}
