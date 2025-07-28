import { registerAs } from '@nestjs/config';
import { JwtModuleOptions } from '@nestjs/jwt';

export default registerAs(
  'jwt',
  (): JwtModuleOptions => ({
    secret: process.env.JWT_SECRET || 'default-secret-key',
    signOptions: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'ldesign-api',
      audience: 'ldesign-client',
    },
  }),
);

export const jwtRefreshConfig = {
  secret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key',
  expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};

export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'default-secret-key',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};