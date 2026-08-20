import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateOpinionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Opini minimal berisi 3 karakter' })
  opinionText: string;
}
