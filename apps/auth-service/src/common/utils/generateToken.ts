import crypto from 'crypto';

/**
 * Generates a random token and returns both the plain and hashed versions.
 *
 * @returns {{ token: string, hashedToken: string }} The plain token and its SHA-256 hash
 */
export const generateToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};
