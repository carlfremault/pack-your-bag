/**
 * Anonymizes an IP address to comply with GDPR data minimization.
 * IPv4: Sets the last octet to 0 (e.g., 192.168.1.45 -> 192.168.1.0)
 * IPv6: Preserves first 48 bits (3 groups), zeros the rest (e.g., 2001:db8:85a3:0:0:8a2e:370:7334 -> 2001:db8:85a3::)
 */
export default function anonymizeIp(ip?: string): string {
  if (!ip) return '0.0.0.0';

  // Handle IPv4-mapped IPv6 (e.g. ::ffff:192.168.1.1)
  const lowerIp = ip.toLowerCase();
  if (lowerIp.includes('::ffff:') || (lowerIp.includes(':ffff:') && ip.includes('.'))) {
    const ipv4Part = ip.split(':').pop();
    return `::ffff:${anonymizeIp(ipv4Part)}`;
  }

  // Standard IPv4 logic
  if (ip.includes('.') && !ip.includes(':')) {
    return ip.replace(/\.[^.]+$/, '.0');
  }

  // Standard IPv6 logic
  if (ip.includes(':')) {
    const expandedIpv6 = expandIPv6(ip);
    if (!expandedIpv6) return '::';

    const groups = expandedIpv6.split(':');
    if (groups.length >= 3) {
      return `${groups[0]}:${groups[1]}:${groups[2]}::`;
    }
    return '::';
  }

  return ip;
}

/**
 * Expands a compressed IPv6 address to its full 8-group form
 */
function expandIPv6(ip: string): string | null {
  if (ip === '::') {
    return '0:0:0:0:0:0:0:0';
  }

  const parts = ip.split('::');

  // Invalid if more than one ::
  if (parts.length > 2) return null;

  if (parts.length === 1) {
    // No compression, validate it has 8 groups
    const part = parts[0];
    if (!part) return null; // Obligatory TS check
    const groups = part.split(':');
    return groups.length === 8 ? part : null;
  }

  // Expand the :: compression
  const leftPart = parts[0];
  const rightPart = parts[1];

  const leftGroups = leftPart ? leftPart.split(':') : [];
  const rightGroups = rightPart ? rightPart.split(':') : [];
  const missingGroups = 8 - leftGroups.length - rightGroups.length;

  if (missingGroups < 0) return null;

  const middleGroups = Array.from({ length: missingGroups }, () => '0');
  return [...leftGroups, ...middleGroups, ...rightGroups].join(':');
}
