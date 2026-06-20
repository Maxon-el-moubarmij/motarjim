import { describe, it, expect } from 'vitest';
import { validateHtml, validateCss, validateInput } from '../../services/validate-service.js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';

describe('validateHtml', () => {
  it('flags missing DOCTYPE', () => {
    const issues = validateHtml('<html><body></body></html>', 'test.html');
    expect(issues.some(i => i.message.includes('DOCTYPE'))).toBe(true);
  });

  it('does not flag DOCTYPE when present', () => {
    const issues = validateHtml('<!DOCTYPE html><html><body></body></html>', 'test.html');
    expect(issues.every(i => !i.message.includes('DOCTYPE'))).toBe(true);
  });
});

describe('validateCss', () => {
  it('flags unsupported selectors', () => {
    const issues = validateCss('.card:hover { color: red; }', 'test.css');
    expect(issues.some(i => i.message.includes(':hover'))).toBe(true);
  });

  it('flags unsupported properties', () => {
    const issues = validateCss('.card { backdrop-filter: blur(10px); }', 'test.css');
    expect(issues.some(i => i.message.includes('backdrop-filter'))).toBe(true);
  });

  it('ignores valid CSS', () => {
    const issues = validateCss('.card { color: red; font-size: 16px; }', 'test.css');
    expect(issues.length).toBe(0);
  });
});

describe('validateInput', () => {
  it('returns error for missing file', () => {
    const result = validateInput('/nonexistent/file.html');
    expect(result.valid).toBe(false);
    expect(result.issues[0].type).toBe('error');
  });

  it('validates existing HTML files', () => {
    const dir = join(tmpdir(), `html-native-test-${randomUUID()}`);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const file = join(dir, 'test.html');
    writeFileSync(file, '<!DOCTYPE html><html><body><p>Hello</p></body></html>', 'utf-8');

    const result = validateInput(file);
    expect(result.valid).toBe(true);
  });
});
