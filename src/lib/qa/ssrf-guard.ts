import "server-only";

import dns from "node:dns/promises";

/**
 * Blocks a Playwright navigation from reaching a private/internal address.
 *
 * Used by openStagingPage() (agent.ts), shared by every caller that opens a
 * URL: Tier2's contract-bound agent and the contract-free standalone-qa
 * check. Tier2 has some natural friction (a real signed contract) limiting
 * who can reach this at all; standalone-qa has none -- any free signup can
 * point a Lancerix server at a URL of their choosing, which without this
 * check is a working SSRF primitive against cloud metadata endpoints
 * (169.254.169.254), internal services, or localhost.
 *
 * Deliberately not the `private-ip` npm package: it carries an unpatched
 * high-severity SSRF advisory of its own (GHSA-9h3q-32c7-r533, no fix
 * available) -- using it here would trade one SSRF gap for another. This
 * checks Node's own `dns.lookup()` result (a normalized address object, not
 * a string an attacker can format to dodge a regex) against the known
 * private/loopback/link-local ranges directly.
 *
 * Fails closed: an unparseable URL or a DNS lookup failure is treated as
 * blocked, not allowed -- a page that can't be resolved can't be reached
 * anyway, so blocking early costs nothing functionally.
 *
 * Residual risk (documented, not fixed tonight): DNS rebinding. The address
 * is resolved once, here, before navigation; a hostname whose DNS answer
 * changes between this check and Playwright's actual connection (a public IP
 * at check-time, an internal one at connect-time) would slip through. Closing
 * that needs connection-level interception (e.g. Playwright request routing
 * pinned to the resolved IP), which is a larger change than this check-time
 * mitigation -- worth revisiting if this feature sees real hostile traffic.
 */
export async function isBlockedTarget(urlString: string): Promise<boolean> {
  let hostname: string;
  try {
    hostname = new URL(urlString).hostname;
  } catch {
    return true;
  }

  let addresses: { address: string; family: number }[];
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    return true;
  }

  return addresses.some((a) => (a.family === 4 ? isBlockedIpv4(a.address) : isBlockedIpv6(a.address)));
}

const BLOCKED_IPV4_RANGES: readonly { base: string; bits: number }[] = [
  { base: "0.0.0.0", bits: 8 }, // "this network"
  { base: "10.0.0.0", bits: 8 }, // RFC1918 private
  { base: "100.64.0.0", bits: 10 }, // carrier-grade NAT
  { base: "127.0.0.0", bits: 8 }, // loopback
  { base: "169.254.0.0", bits: 16 }, // link-local, incl. cloud metadata (169.254.169.254)
  { base: "172.16.0.0", bits: 12 }, // RFC1918 private
  { base: "192.0.0.0", bits: 24 }, // IETF protocol assignments
  { base: "192.168.0.0", bits: 16 }, // RFC1918 private
  { base: "198.18.0.0", bits: 15 }, // benchmarking
  { base: "224.0.0.0", bits: 4 }, // multicast + reserved
];

function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
}

export function isBlockedIpv4(ip: string): boolean {
  const target = ipv4ToInt(ip);
  return BLOCKED_IPV4_RANGES.some(({ base, bits }) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (target & mask) === (ipv4ToInt(base) & mask);
  });
}

/**
 * IPv6 checked by normalized-address prefix rather than full CIDR math --
 * Node's dns.lookup() always returns the canonical compressed form, so a
 * prefix match here can't be dodged by writing the same address differently.
 * An IPv4-mapped address (::ffff:10.0.0.1) is unwrapped and re-checked
 * against the IPv4 ranges above, since that's the actual reachable target.
 */
export function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe8") || lower.startsWith("fe9") || lower.startsWith("fea") || lower.startsWith("feb")) {
    return true; // link-local fe80::/10
  }
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique local fc00::/7

  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isBlockedIpv4(mapped[1]!);

  return false;
}
