import { describe, it, expect } from 'vitest';
import { initCommand } from '../../commands/init.js';

describe('initCommand', () => {
  it('exists and is a function', () => {
    expect(typeof initCommand).toBe('function');
  });
});
