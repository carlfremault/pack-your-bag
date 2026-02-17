import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user: unknown }>();
    const user = request.user;
    if (!user) throw new UnauthorizedException('CurrentUser decorator used without a Guard');
    return data ? (user as Record<string, unknown>)[data] : user;
  },
);
