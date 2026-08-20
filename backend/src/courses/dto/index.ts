import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  lecturerId: string;

  @IsString()
  @IsNotEmpty()
  term: string;
}

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  lecturerId?: string;

  @IsOptional()
  @IsString()
  term?: string;
}

export class EnrollStudentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  studentIds: string[];
}
