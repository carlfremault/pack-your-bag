import { IntegrationTestContext } from 'test/helpers/setup.helpers';

import { MS_PER_DAY } from '@/common/constants/auth.constants';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';

export const createAuthenticatedUser = async (ctx: IntegrationTestContext) => {
  const response = await ctx.authHelpers.registerUser();
  const { access_token, refresh_token } = response.body as AuthResponseDto;

  const user = await ctx.prisma.user.findUnique({
    where: { email: ctx.authHelpers.defaultUser.email },
  });
  if (!user) throw new Error('User not found after registration');

  return { user, access_token, refresh_token };
};

export const createUserWithMultipleTokens = async (ctx: IntegrationTestContext) => {
  const authenticatedUser = await createAuthenticatedUser(ctx);

  await ctx.authHelpers.loginUser();
  await ctx.authHelpers.refreshToken(authenticatedUser.refresh_token);

  return authenticatedUser;
};

export const createExpiredSoftDeletedUser = async (ctx: IntegrationTestContext) => {
  const { user, access_token } = await createUserWithMultipleTokens(ctx);
  await ctx.authHelpers.deleteUser({
    token: access_token,
    password: ctx.authHelpers.defaultUser.password,
  });

  const userDeleteRetentionPeriod = ctx.configService.get<number>(
    'AUTH_USER_DELETE_RETENTION_DAYS',
  );
  if (!userDeleteRetentionPeriod) throw new Error('AUTH_USER_DELETE_RETENTION_DAYS is not set');

  await ctx.prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date(Date.now() - (userDeleteRetentionPeriod + 1) * MS_PER_DAY) },
  });

  return { user, access_token };
};

export const createNotYetExpiredSoftDeletedUser = async (ctx: IntegrationTestContext) => {
  const { user, access_token } = await createUserWithMultipleTokens(ctx);
  await ctx.authHelpers.deleteUser({
    token: access_token,
    password: ctx.authHelpers.defaultUser.password,
  });

  const userDeleteRetentionPeriod = ctx.configService.get<number>(
    'AUTH_USER_DELETE_RETENTION_DAYS',
  );
  if (!userDeleteRetentionPeriod) throw new Error('AUTH_USER_DELETE_RETENTION_DAYS is not set');

  await ctx.prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date(Date.now() - (userDeleteRetentionPeriod - 1) * MS_PER_DAY) },
  });

  return { user, access_token };
};

export const createAndHardDeleteUser = async (ctx: IntegrationTestContext) => {
  const response = await createExpiredSoftDeletedUser(ctx);
  await ctx.tasksService.cleanupDeletedUsers();
  return response;
};
