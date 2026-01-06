import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UserDto {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and be at least 8 characters long. Special characters are allowed.',
  })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters.' })
  readonly password: string;
}
