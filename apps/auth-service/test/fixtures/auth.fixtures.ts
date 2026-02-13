import crypto from 'crypto';
import { IntegrationTestContext } from 'test/helpers/setup.helpers';
import { v7 as uuidv7 } from 'uuid';

import { MS_PER_DAY } from '@/common/constants/auth.constants';
import { TokenType, User } from '@/generated/prisma';

export interface MailpitMessage {
  To: { Address: string }[];
  Subject: string;
  ID: string;
  HTML: string;
  Text: string;
}

const GRACE_PERIOD_BUFFER_MS = 1000;

export const createAuthenticatedUser = async (ctx: IntegrationTestContext) => {
  const response = await ctx.authHelpers.registerUser();
  const { access_token, refresh_token } = response.body;

  const user = await ctx.prisma.user.findUnique({
    where: { email: ctx.authHelpers.defaultUser.email },
  });
  if (!user) throw new Error('User not found after registration');

  return { user, access_token, refresh_token };
};

export const createAndLoginUser = async (ctx: IntegrationTestContext) => {
  await createAuthenticatedUser(ctx);
  return await ctx.authHelpers.loginUser();
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

  await ctx.prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date(Date.now() - (ctx.userDeleteRetentionPeriod + 1) * MS_PER_DAY) },
  });

  return { user, access_token };
};

export const createNotYetExpiredSoftDeletedUser = async (ctx: IntegrationTestContext) => {
  const { user, access_token } = await createUserWithMultipleTokens(ctx);
  await ctx.authHelpers.deleteUser({
    token: access_token,
    password: ctx.authHelpers.defaultUser.password,
  });

  await ctx.prisma.user.update({
    where: { id: user.id },
    data: { deletedAt: new Date(Date.now() - (ctx.userDeleteRetentionPeriod - 1) * MS_PER_DAY) },
  });

  return { user, access_token };
};

export const createAndHardDeleteUser = async (
  ctx: IntegrationTestContext,
): Promise<{ user: User; access_token: string }> => {
  const response = await createExpiredSoftDeletedUser(ctx);
  await ctx.tasksService.cleanupDeletedUsers();
  return response;
};

export const generateAndStoreVerificationToken = async ({
  ctx,
  type,
  expiresAt,
}: {
  ctx: IntegrationTestContext;
  type: TokenType;
  expiresAt: Date;
}): Promise<{ user: User; token: string }> => {
  const { user } = await createAuthenticatedUser(ctx);
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  await ctx.verificationTokenService.upsertVerificationToken(
    {
      userId_type: {
        userId: user.id,
        type,
      },
    },
    {
      token: hashedToken,
      expiresAt,
      used: false,
    },
    {
      id: uuidv7(),
      token: hashedToken,
      type,
      user: { connect: { id: user.id } },
      expiresAt,
    },
  );

  return { user, token };
};

export const waitForGracePeriod = async (ctx: IntegrationTestContext) => {
  await ctx.authHelpers.sleep(ctx.gracePeriod + GRACE_PERIOD_BUFFER_MS);
};

export const getMailpitMessages = async (
  ctx: IntegrationTestContext,
): Promise<MailpitMessage[]> => {
  const response = await fetch(`${ctx.mailpitUrl}/messages`);
  if (!response.ok) {
    throw new Error(`Failed to fetch Mailpit messages: ${response.status} ${response.statusText}`);
  }
  const { messages } = (await response.json()) as { messages: MailpitMessage[] };
  return messages;
};

export const getMailpitMessage = async (
  ctx: IntegrationTestContext,
  id: string,
): Promise<MailpitMessage> => {
  const response = await fetch(`${ctx.mailpitUrl}/message/${id}`);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Mailpit message ${id}: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as MailpitMessage;
};
