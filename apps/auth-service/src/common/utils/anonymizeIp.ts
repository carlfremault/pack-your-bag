/**
 * Anonymizes an IP address to comply with GDPR data minimization.
 * IPv4: Sets the last octet to 0 (e.g., 192.168.1.45 -> 192.168.1.0)
 * IPv6: Preserves first 48 bits (3 groups), zeros the rest (e.g., 2001:db8:85a3:0:0:8a2e:370:7334 -> 2001:db8:85a3::)
 */
export default function anonymizeIp(ip?: string): string {
  if (!ip) return '0.0.0.0';

  // IPv4 logic
  if (ip.includes('.')) {
    return ip.replace(/\d+$/, '0');
  }

  // IPv6 logic
  if (ip.includes(':')) {
    // IPv6 addresses consist of 8 groups. This preserves the first 3 groups (the prefix).
    const parts = ip.split(':');
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:${parts[2]}::`;
    }
    return '::'; // Fallback for shortened/malformed IPv6
  }

  return ip;
}
