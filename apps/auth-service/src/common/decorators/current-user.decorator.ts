import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export enum UserRole {
  User = 1,
  Admin = 2,
}

export interface ActiveUser {
  userId: string;
  roleId: UserRole;
}

export const CurrentUser = createParamDecorator(
  (data: keyof ActiveUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user: ActiveUser }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('CurrentUser decorator used without a Guard');
    }

    return data ? user[data] : user;
  },
);
