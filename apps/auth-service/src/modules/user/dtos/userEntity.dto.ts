import { Expose } from 'class-transformer';

export class UserEntity {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  roleId: number;
}
