import { describe, it, expect } from 'vitest';
import { detectTargetFromOutput, findMatchingCss, generateDefaultOutput } from '../../config/defaults.js';

describe('detectTargetFromOutput', () => {
  it('detects flutter from .dart', () => {
    expect(detectTargetFromOutput('output.dart')).toBe('flutter');
  });

  it('detects compose from .kt', () => {
    expect(detectTargetFromOutput('output.kt')).toBe('compose');
  });

  it('detects swiftui from .swift', () => {
    expect(detectTargetFromOutput('output.swift')).toBe('swiftui');
  });

  it('returns undefined for unknown extension', () => {
    expect(detectTargetFromOutput('output.js')).toBeUndefined();
  });
});

describe('generateDefaultOutput', () => {
  it('generates .dart for flutter', () => {
    const output = generateDefaultOutput('index.html', 'flutter');
    expect(output).toContain('index.dart');
  });

  it('generates .kt for compose', () => {
    const output = generateDefaultOutput('home.html', 'compose');
    expect(output).toContain('home.kt');
  });

  it('generates .swift for swiftui', () => {
    const output = generateDefaultOutput('page.html', 'swiftui');
    expect(output).toContain('page.swift');
  });
});

describe('findMatchingCss', () => {
  it('returns undefined for non-existent css', () => {
    const result = findMatchingCss('/tmp/nonexistent/file.html');
    expect(result).toBeUndefined();
  });
});
