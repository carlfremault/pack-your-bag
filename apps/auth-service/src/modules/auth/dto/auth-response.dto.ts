import { Expose } from 'class-transformer';

export class AuthResponseDto {
  @Expose()
  readonly access_token: string;

  @Expose()
  readonly refresh_token: string;

  @Expose()
  readonly token_type: string = 'Bearer';

  @Expose()
  readonly expires_in: number;

  @Expose()
  readonly user: { id: string; role: number };
}
