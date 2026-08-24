import type { IdGenerator } from '../../types/ports';

const UUID_V4_VERSION_BYTE_INDEX = 6;
const UUID_V4_VARIANT_BYTE_INDEX = 8;

function randomUuidFromBytes(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[UUID_V4_VERSION_BYTE_INDEX] = ((bytes[UUID_V4_VERSION_BYTE_INDEX] ?? 0) & 0x0f) | 0x40;
  bytes[UUID_V4_VARIANT_BYTE_INDEX] = ((bytes[UUID_V4_VARIANT_BYTE_INDEX] ?? 0) & 0x3f) | 0x80;

  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

export function createCryptoIdGenerator(): IdGenerator {
  return {
    next(): string {
      if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
      return randomUuidFromBytes();
    },
  };
}
