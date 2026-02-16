import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DeleteUserDto {
  @IsNotEmpty()
  @IsString()
  readonly password: string;

  @IsOptional()
  @IsString()
  readonly locale?: string;
}
