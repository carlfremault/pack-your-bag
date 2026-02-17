import { IsNotEmpty, IsString } from 'class-validator';

export class CancelDeletionDto {
  @IsNotEmpty()
  @IsString()
  readonly token: string;

  @IsNotEmpty()
  @IsString()
  readonly password: string;
}
