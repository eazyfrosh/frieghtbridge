#!/usr/bin/env node
/**
 * Generates the scrypt hash for ADMIN_PASSWORD_HASH.
 *
 *   npm run hash-password
 *
 * Prompts without echoing, so the password does not land in your shell
 * history. Prints only the hash — the plaintext is never written anywhere.
 */
import { createInterface } from 'node:readline';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const N = 16384;
const R = 8;
const P = 1;

function prompt(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    // Suppress echo while the password is typed.
    const onData = () => rl.output.write('[2K[200D' + question);
    rl.output.write(question);
    rl.input.on('data', onData);
    rl.question('', (answer) => {
      rl.input.removeListener('data', onData);
      rl.output.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

const password = (await prompt('New admin password: ')).trim();

if (password.length < 12) {
  console.error('\nToo short. Use at least 12 characters — this is the only credential on the account.');
  process.exit(1);
}

const salt = randomBytes(16);
const key = await scryptAsync(password.normalize('NFKC'), salt, 64, { N, r: R, p: P });
const hash = ['scrypt', N, R, P, salt.toString('hex'), key.toString('hex')].join(':');

console.log('\nAdd this to your environment:\n');
console.log(`ADMIN_PASSWORD_HASH='${hash}'\n`);
console.log('And a session secret, if you have not set one:\n');
console.log(`AUTH_SECRET='${randomBytes(32).toString('base64')}'\n`);
