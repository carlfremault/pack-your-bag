export interface RefreshTokenUser {
  readonly userId: string;
  readonly tokenId: string;
  readonly tokenFamilyId: string;
  readonly isGuest: boolean;
}
