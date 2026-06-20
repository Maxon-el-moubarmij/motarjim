import { describe, it, expect } from 'vitest';
import type { UiNode } from '@html-native/shared';
import { countNodes, countComponentNodes, countLines, computeOptimizationSavings, generateStatsTable } from '../../services/stats.js';

describe('countNodes', () => {
  it('counts a single node', () => {
    const node: UiNode = { type: 'Container', properties: {}, children: [] };
    expect(countNodes(node)).toBe(1);
  });

  it('counts nested nodes', () => {
    const node: UiNode = {
      type: 'Container',
      properties: {},
      children: [
        { type: 'Text', properties: {}, children: [], value: 'hi' },
        { type: 'Button', properties: {}, children: [] },
      ],
    };
    expect(countNodes(node)).toBe(3);
  });
});

describe('countComponentNodes', () => {
  it('counts detected components', () => {
    const node: UiNode = {
      type: 'Container',
      properties: {},
      children: [
        { type: 'Button', properties: {}, children: [] },
        { type: 'Card', properties: {}, children: [] },
        { type: 'Text', properties: {}, children: [], value: 'hi' },
      ],
    };
    expect(countComponentNodes(node)).toBe(2);
  });
});

describe('countLines', () => {
  it('counts lines in code', () => {
    expect(countLines('line1\nline2\nline3')).toBe(3);
  });
});

describe('computeOptimizationSavings', () => {
  it('computes percentage savings', () => {
    const original: UiNode = {
      type: 'Container', properties: {},
      children: [
        { type: 'Container', properties: {}, children: [
          { type: 'Text', properties: {}, children: [], value: 'hi' },
        ]},
      ],
    };
    const optimized: UiNode = {
      type: 'Container', properties: {},
      children: [
        { type: 'Text', properties: {}, children: [], value: 'hi' },
      ],
    };
    const savings = computeOptimizationSavings(original, optimized);
    expect(savings).toBeGreaterThan(0);
  });
});

describe('generateStatsTable', () => {
  it('generates a formatted stats table', () => {
    const stats = {
      htmlNodes: 100, styledNodes: 95, componentsDetected: 8,
      optimizationSavings: 15, generatedLines: 300, target: 'flutter' as const,
      duration: 0.5,
    };
    const table = generateStatsTable(stats);
    expect(table).toContain('100');
    expect(table).toContain('Flutter');
    expect(table).toContain('0.50s');
  });
});
