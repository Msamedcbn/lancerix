/**
 * isBlockedIpv4/isBlockedIpv6 are pure and tested directly. isBlockedTarget
 * mocks node:dns/promises so the test suite never makes a real network call
 * (would be slow, flaky, and defeat the point of testing the blocking logic
 * in isolation).
 */
import { describe, expect, it, vi } from "vitest";

const lookupMock = vi.fn();
vi.mock("node:dns/promises", () => ({ default: { lookup: (...args: unknown[]) => lookupMock(...args) } }));

import { isBlockedIpv4, isBlockedIpv6, isBlockedTarget } from "./ssrf-guard";

describe("isBlockedIpv4", () => {
  it.each([
    ["127.0.0.1", true, "loopback"],
    ["169.254.169.254", true, "cloud metadata"],
    ["10.0.0.5", true, "RFC1918 10/8"],
    ["172.16.5.1", true, "RFC1918 172.16/12"],
    ["192.168.1.1", true, "RFC1918 192.168/16"],
    ["0.0.0.0", true, "this network"],
    ["8.8.8.8", false, "public DNS"],
    ["93.184.216.34", false, "public (example.com)"],
  ])("%s -> blocked=%s (%s)", (ip, expected) => {
    expect(isBlockedIpv4(ip)).toBe(expected);
  });
});

describe("isBlockedIpv6", () => {
  it.each([
    ["::1", true, "loopback"],
    ["fe80::1", true, "link-local"],
    ["fc00::1", true, "unique local"],
    ["::ffff:127.0.0.1", true, "IPv4-mapped loopback"],
    ["::ffff:8.8.8.8", false, "IPv4-mapped public"],
    ["2606:4700:4700::1111", false, "public (cloudflare dns)"],
  ])("%s -> blocked=%s (%s)", (ip, expected) => {
    expect(isBlockedIpv6(ip)).toBe(expected);
  });
});

describe("isBlockedTarget", () => {
  it("blocks an unparseable URL without calling dns", async () => {
    const result = await isBlockedTarget("not a url");
    expect(result).toBe(true);
    expect(lookupMock).not.toHaveBeenCalled();
  });

  it("blocks when dns.lookup fails", async () => {
    lookupMock.mockRejectedValueOnce(new Error("ENOTFOUND"));
    expect(await isBlockedTarget("https://nonexistent.example")).toBe(true);
  });

  it("blocks a hostname that resolves to a private address", async () => {
    lookupMock.mockResolvedValueOnce([{ address: "169.254.169.254", family: 4 }]);
    expect(await isBlockedTarget("http://metadata.internal/")).toBe(true);
  });

  it("blocks if ANY resolved address is private, even with a public one present", async () => {
    lookupMock.mockResolvedValueOnce([
      { address: "8.8.8.8", family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);
    expect(await isBlockedTarget("https://mixed-dns.example")).toBe(true);
  });

  it("allows a hostname that resolves only to public addresses", async () => {
    lookupMock.mockResolvedValueOnce([{ address: "93.184.216.34", family: 4 }]);
    expect(await isBlockedTarget("https://example.com")).toBe(false);
  });
});
