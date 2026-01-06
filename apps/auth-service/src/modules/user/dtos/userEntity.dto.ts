import { Expose } from 'class-transformer';

export class UserEntity {
  @Expose()
  readonly id: number;

  @Expose()
  readonly email: string;

  @Expose()
  readonly roleId: number;
}
