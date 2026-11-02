import { createHash } from 'node:crypto';
import { plateKey } from './plateFormat.js';

export { isValidPlate, isValidProvince, plateKey } from './plateFormat.js';

/** NFR-5: logs only ever see this hash, never the plate itself. */
export function hashPlate(number: string, province: string): string {
  const salt = process.env.PLATE_HASH_SALT ?? 'dev-only-salt';
  return createHash('sha256').update(salt + plateKey(number, province)).digest('hex').slice(0, 16);
}
