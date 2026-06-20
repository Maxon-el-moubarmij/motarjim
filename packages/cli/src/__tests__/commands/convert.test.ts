import { describe, it, expect } from 'vitest';
import { convertCommand } from '../../commands/convert.js';

describe('convertCommand', () => {
  it('exists and is a function', () => {
    expect(typeof convertCommand).toBe('function');
  });
});
