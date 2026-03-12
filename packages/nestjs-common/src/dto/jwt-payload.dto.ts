import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export enum JwtTokenType {
  Access = 'access',
  Refresh = 'refresh',
}

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
  @IsInt()
  @IsPositive()
  iat: number;

  @Expose()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  jti: string;

  @Expose()
  @IsEnum(JwtTokenType)
  type: JwtTokenType;

  @Expose()
  @ValidateIf((o: JwtPayload) => o.type === JwtTokenType.Refresh)
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  family?: string;
}
