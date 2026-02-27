import { ApiSecurity } from '@nestjs/swagger';

export const ApiBffSecurity = () => ApiSecurity('bff-secret');

export const ApiBffAndRefreshSecurity = () =>
  ApiSecurity({ 'bff-secret': [], 'refresh-token': [] });

export const ApiBffAndAccessSecurity = () => ApiSecurity({ 'bff-secret': [], 'access-token': [] });
