import { describe, expect, it } from "vitest";
import crypto from "crypto";

describe("API Key Hashing & Verification Logic", () => {
  it("generates and verifies sha256 key hashes correctly", () => {
    const rawSecret = crypto.randomBytes(24).toString("hex");
    const fullKey = `lx_sec_${rawSecret}`;
    const hash = crypto.createHash("sha256").update(fullKey).digest("hex");

    // Simulated incoming bearer auth
    const incomingKey = fullKey;
    const incomingHash = crypto.createHash("sha256").update(incomingKey).digest("hex");

    expect(incomingHash).toBe(hash);
  });

  it("produces a safe masking prefix for UI display", () => {
    const rawSecret = "1234567890abcdef1234567890abcdef1234567890abcdef";
    const keyPrefix = `lx_sec_${rawSecret.slice(0, 6)}...${rawSecret.slice(-4)}`;

    expect(keyPrefix).toBe("lx_sec_123456...cdef");
    expect(keyPrefix.length).toBeLessThan(30);
  });
});
