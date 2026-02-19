/**
 * Anonymizes an email address
 * For local parts > 2 chars: keeps first 2 and last character
 * For local parts <= 2 chars: keeps only the first character
 * Keeps the domain intact
 *
 * @param email - The email address to anonymize
 * @returns The anonymized email
 */
export function anonymizeEmail(email: string): string {
  if (!email || !email.includes('@')) return 'invalid-email';

  const atIndex = email.indexOf('@');
  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  if (!localPart || !domain || domain.includes('@')) return 'invalid-email';

  if (localPart.length <= 2) {
    return `${localPart[0]}***@${domain}`;
  }

  const visibleStart = localPart.substring(0, 2);
  const visibleEnd = localPart.substring(localPart.length - 1);

  return `${visibleStart}***${visibleEnd}@${domain}`;
}
