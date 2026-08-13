import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';
import { promisify } from 'node:util';

// `promisify`'s inferred overload drops the options argument, so the cost
// parameters would be silently ignored. Type it explicitly instead.
const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * Password hashing with scrypt — a memory-hard KDF, in Node's standard library,
 * so there is no native dependency to build or keep patched.
 *
 * Node only: `node:crypto`'s scrypt is not available on the Edge runtime, which
 * is why middleware verifies the session JWT instead of a password.
 *
 * Format: `scrypt:N:r:p:<salt hex>:<key hex>`. Parameters travel with the hash
 * so they can be raised later without invalidating existing ones.
 *
 * The separator is a colon, not the conventional `$`. This value lives in an
 * environment variable, and both Next's own .env loader and most hosting
 * providers' env UIs perform shell-style `$VAR` expansion — a `$`-delimited
 * hash silently arrives truncated and every sign-in fails with no clue why.
 * Hex and the fixed prefix contain no colons, so this is unambiguous.
 */

const N = 16384; // CPU/memory cost
const R = 8; // block size
const P = 1; // parallelism
const KEY_LEN = 64;
const SALT_LEN = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const key = await scryptAsync(password.normalize('NFKC'), salt, KEY_LEN, { N, r: R, p: P });
  return ['scrypt', N, R, P, salt.toString('hex'), key.toString('hex')].join(':');
}

/**
 * Constant-time verification. Returns false for a malformed hash rather than
 * throwing, so a bad `ADMIN_PASSWORD_HASH` denies access instead of leaking a
 * stack trace to the login response.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, n, r, p, saltHex, keyHex] = parts;
  const cost = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Number.isFinite(cost.N) || !Number.isFinite(cost.r) || !Number.isFinite(cost.p)) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(keyHex, 'hex');
  } catch {
    return false;
  }
  if (expected.length === 0) return false;

  const actual = await scryptAsync(password.normalize('NFKC'), Buffer.from(saltHex, 'hex'), expected.length, cost);

  // Lengths match by construction, but timingSafeEqual throws if they differ.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
