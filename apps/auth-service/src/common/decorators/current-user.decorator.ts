import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { ActiveUser } from '../interfaces/active-user.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof ActiveUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user: ActiveUser }>();
    const user: ActiveUser = request.user;

    if (!user) {
      throw new UnauthorizedException('CurrentUser decorator used without a Guard');
    }

    return data ? user[data] : user;
  },
);
