import { Expose } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class JwtPayload {
  @Expose()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  sub: string;

  @Expose()
  @IsInt()
  @IsPositive()
  role: number;

  @Expose()
  @IsNumber()
  @IsPositive()
  iat: number;

  @Expose()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  jti: string;

  @Expose()
  @IsString()
  @IsIn(['access', 'refresh'])
  type: 'access' | 'refresh';

  @Expose()
  @ValidateIf((o: JwtPayload) => o.type === 'refresh')
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  family?: string;
}
