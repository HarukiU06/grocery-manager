import { describe, expect, it } from 'vitest';
import { newId } from './ids';

describe('newId', () => {
  it('prefixes and never repeats', () => {
    const ids = new Set(Array.from({ length: 200 }, () => newId('custom')));
    expect(ids.size).toBe(200);
    for (const id of ids) expect(id.startsWith('custom-')).toBe(true);
  });
});
