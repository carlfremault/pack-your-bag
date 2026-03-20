import { JwtTestHelper } from '@repo/nestjs-common';

export class AuthHelpers {
  constructor(private readonly jwtTestHelper: JwtTestHelper) {}

  getValidAccessToken(userId: string): string {
    return this.jwtTestHelper.generateAccessToken({ userId });
  }

  getExpiredAccessToken(userId: string): string {
    return this.jwtTestHelper.generateExpiredToken({ userId });
  }
}
