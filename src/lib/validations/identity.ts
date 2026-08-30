import { z } from "zod";

/**
 * Turkish identity and tax number checksums, plus IBAN mod-97.
 *
 * These are format checks only. A number that passes here is well-formed, not
 * verified as belonging to the person presenting it -- that requires the NVI /
 * GIB lookup services and is a separate step before first payout.
 */

/**
 * TCKN (Turkish Republic Identity Number), 11 digits.
 *   - digit 1 is non-zero
 *   - digit 10 = ((sum of digits 1,3,5,7,9) * 7 - (sum of digits 2,4,6,8)) mod 10
 *   - digit 11 = (sum of digits 1..10) mod 10
 */
export function isValidTckn(value: string): boolean {
  if (!/^[1-9][0-9]{10}$/.test(value)) return false;

  const digits = [...value].map(Number) as number[];

  let oddSum = 0;
  let evenSum = 0;
  for (let i = 0; i < 9; i += 1) {
    const digit = digits[i] ?? 0;
    if (i % 2 === 0) oddSum += digit;
    else evenSum += digit;
  }

  // JS % can go negative here, so normalise before comparing.
  const tenth = (((oddSum * 7 - evenSum) % 10) + 10) % 10;
  if (digits[9] !== tenth) return false;

  const eleventh = (oddSum + evenSum + tenth) % 10;
  return digits[10] === eleventh;
}

/**
 * VKN (corporate tax number), 10 digits, with the GIB weighted checksum.
 */
export function isValidVkn(value: string): boolean {
  if (!/^[0-9]{10}$/.test(value)) return false;

  const digits = [...value].map(Number) as number[];

  let total = 0;
  for (let i = 0; i < 9; i += 1) {
    const tmp = ((digits[i] ?? 0) + 9 - i) % 10;
    if (tmp === 0) continue;
    const partial = (tmp * 2 ** (9 - i)) % 9;
    total += partial === 0 ? 9 : partial;
  }

  return digits[9] === (10 - (total % 10)) % 10;
}

/** Turkish IBAN: TR + 24 digits, validated with the ISO 13616 mod-97 check. */
export function isValidTrIban(value: string): boolean {
  const iban = value.replace(/\s/g, "").toUpperCase();
  if (!/^TR[0-9]{24}$/.test(iban)) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const expanded = [...rearranged]
    .map((char) =>
      char >= "A" && char <= "Z" ? String(char.charCodeAt(0) - 55) : char,
    )
    .join("");

  // Chunked so the running value never leaves the safe integer range.
  let remainder = 0;
  for (const char of expanded) {
    remainder = (remainder * 10 + Number(char)) % 97;
  }
  return remainder === 1;
}

export const tcknSchema = z
  .string()
  .trim()
  .refine(isValidTckn, "Enter a valid 11-digit TCKN.");

export const vknSchema = z
  .string()
  .trim()
  .refine(isValidVkn, "Enter a valid 10-digit VKN.");

export const trIbanSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\s/g, "").toUpperCase())
  .refine(isValidTrIban, "Enter a valid Turkish IBAN.");
