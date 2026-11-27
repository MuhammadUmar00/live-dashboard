import { describe, expect, it } from 'vitest';
import { validateEvent } from './validate';
import { appendBounded } from './helpers';

const validEvent = {
  id: '1',
  timestamp: 1000,
  service: 'API',
  status: 'success',
  latency: 30,
  message: 'OK',
};

describe('stream validation', () => {
  it('accepts valid events and strips extra keys', () => {
    expect(validateEvent({ ...validEvent, token: 'secret' })).toEqual(validEvent);
  });

  it.each([
    null,
    {},
    { ...validEvent, latency: Infinity },
    { ...validEvent, status: 'unknown' },
    { ...validEvent, message: 'x'.repeat(241) },
  ])('rejects malformed messages (%o)', (value) => {
    expect(validateEvent(value)).toBeNull();
  });

  it('preserves text without treating it as HTML', () => {
    const message = '<script>alert(1)</script>';

    expect(validateEvent({ ...validEvent, message })?.message).toBe(message);
  });

  it('retains only the newest items', () => {
    expect(appendBounded([1, 2], [3, 4], 3)).toEqual([2, 3, 4]);
  });
});
