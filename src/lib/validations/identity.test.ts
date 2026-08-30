import { describe, expect, it } from "vitest";

import { isValidTckn, isValidTrIban, isValidVkn } from "@/lib/validations/identity";

/**
 * Builds a checksum-valid TCKN from the first nine digits, so the tests below
 * exercise the algorithm rather than hard-coding somebody's real number.
 */
function makeTckn(firstNine: string): string {
  const digits = [...firstNine].map(Number);
  let oddSum = 0;
  let evenSum = 0;
  digits.forEach((digit, index) => {
    if (index % 2 === 0) oddSum += digit;
    else evenSum += digit;
  });
  const tenth = (((oddSum * 7 - evenSum) % 10) + 10) % 10;
  const eleventh = (oddSum + evenSum + tenth) % 10;
  return `${firstNine}${tenth}${eleventh}`;
}

describe("isValidTckn", () => {
  it("accepts a hand-verified number", () => {
    // 10000000146: odd digits (1,0,0,0,1) sum 2, even digits (0,0,0,0) sum 0.
    // d10 = (2*7 - 0) mod 10 = 4. d11 = (2 + 0 + 4) mod 10 = 6.
    expect(isValidTckn("10000000146")).toBe(true);
  });

  it("accepts numbers built to the official checksum", () => {
    for (const seed of ["123456789", "100000000", "987654321", "555555555"]) {
      expect(isValidTckn(makeTckn(seed))).toBe(true);
    }
  });

  it("accepts exactly one of the 100 possible check-digit pairs", () => {
    // A structural property: if more than one pair passed, the checksum would
    // not be catching anything.
    for (const prefix of ["123456789", "246813579"]) {
      let accepted = 0;
      for (let tenth = 0; tenth < 10; tenth += 1) {
        for (let eleventh = 0; eleventh < 10; eleventh += 1) {
          if (isValidTckn(`${prefix}${tenth}${eleventh}`)) accepted += 1;
        }
      }
      expect(accepted).toBe(1);
    }
  });

  it("rejects a leading zero", () => {
    const valid = makeTckn("123456789");
    expect(isValidTckn(`0${valid.slice(1)}`)).toBe(false);
  });

  it("rejects a corrupted check digit", () => {
    const valid = makeTckn("123456789");
    const lastDigit = Number(valid[10]);
    const corrupted = `${valid.slice(0, 10)}${(lastDigit + 1) % 10}`;
    expect(isValidTckn(corrupted)).toBe(false);
  });

  it("rejects a single transposed digit in the body", () => {
    // Flipping one body digit breaks the 10th-digit check.
    const valid = makeTckn("123456789");
    const corrupted = `${valid.slice(0, 3)}9${valid.slice(4)}`;
    expect(isValidTckn(corrupted)).toBe(false);
  });

  it("rejects wrong lengths and non-digits", () => {
    expect(isValidTckn("")).toBe(false);
    expect(isValidTckn("1234567890")).toBe(false);
    expect(isValidTckn("123456789012")).toBe(false);
    expect(isValidTckn("1234567890a")).toBe(false);
    expect(isValidTckn("12345 67890")).toBe(false);
  });
});

describe("isValidVkn", () => {
  it("accepts a hand-verified number", () => {
    // 0810019242. Weighted digits, in order: 9,6,7,6,7,8,7,7,1 -> sum 58.
    // check = (10 - 58 mod 10) mod 10 = 2, which is the 10th digit.
    expect(isValidVkn("0810019242")).toBe(true);
  });

  it("rejects a corrupted check digit", () => {
    expect(isValidVkn("0810019243")).toBe(false);
    expect(isValidVkn("0810019240")).toBe(false);
  });

  it("accepts exactly one of the ten possible check digits", () => {
    for (const prefix of ["081001924", "123456789", "999999999"]) {
      const accepted = Array.from({ length: 10 }, (_, digit) =>
        isValidVkn(`${prefix}${digit}`),
      ).filter(Boolean);
      expect(accepted).toHaveLength(1);
    }
  });

  it("rejects wrong lengths and non-digits", () => {
    expect(isValidVkn("484004775")).toBe(false);
    expect(isValidVkn("48400477521")).toBe(false);
    expect(isValidVkn("484004775a")).toBe(false);
  });
});

describe("isValidTrIban", () => {
  it("accepts a mod-97 valid Turkish IBAN", () => {
    expect(isValidTrIban("TR330006100519786457841326")).toBe(true);
  });

  it("tolerates spacing and lower case", () => {
    expect(isValidTrIban("tr33 0006 1005 1978 6457 8413 26")).toBe(true);
  });

  it("rejects a bad checksum, a non-TR country and a wrong length", () => {
    expect(isValidTrIban("TR330006100519786457841327")).toBe(false);
    expect(isValidTrIban("DE89370400440532013000")).toBe(false);
    expect(isValidTrIban("TR33000610051978645784132")).toBe(false);
  });
});
