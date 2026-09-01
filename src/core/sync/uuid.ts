/**
 * UUIDv7, minted on the device (ADR 004 §2).
 *
 * Every row's primary key is generated here, at the moment of the tap, never by the
 * server. Three properties matter and each is load bearing:
 *
 *   1. A write with no signal completes. A row that needs a round trip for its own
 *      identity cannot be created on a boat, and nothing may reference it either.
 *   2. It is the idempotency key. A retried insert collides on the primary key and the
 *      server treats the collision as success, so retry needs no other machinery.
 *   3. It is time-ordered, so it indexes without the random-UUID page-split penalty and
 *      sorts by creation for free.
 *
 * Layout (RFC 9562 §5.7): 48 bits of Unix milliseconds, 4 bits version (7), 12 bits of
 * sub-millisecond sequence, 2 bits variant (0b10), 62 bits of randomness.
 *
 * The sequence counter is what makes two ids minted in the same millisecond still sort
 * in mint order. Without it, "log another" twice inside one millisecond produces ids
 * whose relative order is random — which would silently reorder two catches. Swift
 * implements the same layout against `uuid-vectors.json`.
 */

const VARIANT_HIGH_BITS = 0b1000_0000;
const MAX_SEQUENCE = 0xfff;

let lastTimestampMs = -1;
let sequence = 0;

/** Hex for one byte, 00-ff. Table lookup beats padStart in the hot path. */
const HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Mint a UUIDv7 for `timestampMs` (defaults to now).
 *
 * Monotonic within a millisecond via the 12-bit sequence. If more than 4096 ids are
 * minted in the same millisecond the timestamp is borrowed forward by one — the ids
 * stay unique and ordered, which matters more than the sub-millisecond fiction.
 */
export function uuidv7(timestampMs: number = Date.now()): string {
  let timestamp = Math.floor(timestampMs);

  if (timestamp === lastTimestampMs) {
    sequence += 1;
    if (sequence > MAX_SEQUENCE) {
      timestamp = lastTimestampMs + 1;
      sequence = 0;
    }
  } else if (timestamp < lastTimestampMs) {
    // The device clock stepped backwards (NTP correction, manual change). Keep minting
    // forward from the last id rather than emitting one that sorts before its
    // predecessor: ordering is the property callers depend on, wall-clock exactness is
    // not. `caught_at` carries the real instant and is a separate column.
    timestamp = lastTimestampMs;
    sequence += 1;
    if (sequence > MAX_SEQUENCE) {
      timestamp = lastTimestampMs + 1;
      sequence = 0;
    }
  } else {
    sequence = 0;
  }

  lastTimestampMs = timestamp;

  const bytes = new Uint8Array(16);

  // 48-bit big-endian millisecond timestamp. Number is safe to 2^53, so the top two
  // bytes come off with division rather than a 32-bit shift.
  bytes[0] = Math.floor(timestamp / 2 ** 40) & 0xff;
  bytes[1] = Math.floor(timestamp / 2 ** 32) & 0xff;
  bytes[2] = (timestamp >>> 24) & 0xff;
  bytes[3] = (timestamp >>> 16) & 0xff;
  bytes[4] = (timestamp >>> 8) & 0xff;
  bytes[5] = timestamp & 0xff;

  // version 7 in the high nibble of byte 6, then 12 bits of sequence
  bytes[6] = 0x70 | ((sequence >>> 8) & 0x0f);
  bytes[7] = sequence & 0xff;

  const random = randomBytes(8);
  // variant 0b10 in the top two bits of byte 8
  bytes[8] = VARIANT_HIGH_BITS | (random[0] & 0x3f);
  for (let i = 1; i < 8; i += 1) bytes[8 + i] = random[i];

  let out = "";
  for (let i = 0; i < 16; i += 1) {
    out += HEX[bytes[i]];
    if (i === 3 || i === 5 || i === 7 || i === 9) out += "-";
  }
  return out;
}

/** The millisecond a UUIDv7 was minted, or null if this is not a well-formed v7. */
export function uuidv7TimestampMs(id: string): number | null {
  if (!isUuidv7(id)) return null;
  const hex = id.replace(/-/g, "").slice(0, 12);
  return Number.parseInt(hex, 16);
}

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Shape, version and variant. Does not assert the timestamp is sane. */
export function isUuidv7(id: string): boolean {
  return UUID_SHAPE.test(id);
}

/** Test seam only: reset the monotonic counter so vectors run from a known state. */
export function __resetUuidv7ClockForTests(): void {
  lastTimestampMs = -1;
  sequence = 0;
}
