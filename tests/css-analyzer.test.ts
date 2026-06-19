import { describe, it, expect } from 'vitest';
import { parseCss, matchSelector, resolveStyles } from '../packages/css-analyzer/index.js';

describe('CSS Analyzer', () => {
  it('parses simple CSS rules', () => {
    const css = '.btn { color: red; font-size: 16px; }';
    const sheet = parseCss(css);
    expect(sheet.rules).toHaveLength(1);
    expect(sheet.rules[0].selectors).toEqual(['.btn']);
    expect(sheet.rules[0].declarations).toHaveLength(2);
  });

  it('matches class selectors', () => {
    const node = {
      nodeId: '1',
      tagName: 'div',
      attributes: [{ name: 'class', value: 'btn primary' }],
      children: [],
    };
    expect(matchSelector('.btn', node)).toBe(true);
    expect(matchSelector('.primary', node)).toBe(true);
    expect(matchSelector('.nonexistent', node)).toBe(false);
  });

  it('matches tag selectors', () => {
    const node = {
      nodeId: '1',
      tagName: 'button',
      attributes: [],
      children: [],
    };
    expect(matchSelector('button', node)).toBe(true);
    expect(matchSelector('div', node)).toBe(false);
  });

  it('matches id selectors', () => {
    const node = {
      nodeId: '1',
      tagName: 'div',
      attributes: [{ name: 'id', value: 'main' }],
      children: [],
    };
    expect(matchSelector('#main', node)).toBe(true);
    expect(matchSelector('#other', node)).toBe(false);
  });

  it('matches universal selector', () => {
    const node = {
      nodeId: '1',
      tagName: 'div',
      attributes: [],
      children: [],
    };
    expect(matchSelector('*', node)).toBe(true);
  });

  it('resolves styles for a node', () => {
    const css = '.card { padding: 16px; background: white; border-radius: 8px; }';
    const sheet = parseCss(css);
    const node = {
      nodeId: '1',
      tagName: 'div',
      attributes: [{ name: 'class', value: 'card' }],
      children: [],
    };
    const styles = resolveStyles(node, sheet);
    expect(styles['padding']).toBe('16px');
    expect(styles['background']).toBe('white');
    expect(styles['border-radius']).toBe('8px');
  });

  it('handles multiple rules', () => {
    const css = 'h1 { font-size: 32px; } h1 { color: blue; }';
    const sheet = parseCss(css);
    const node = {
      nodeId: '1',
      tagName: 'h1',
      attributes: [],
      children: [],
    };
    const styles = resolveStyles(node, sheet);
    expect(styles['font-size']).toBe('32px');
    expect(styles['color']).toBe('blue');
  });
});
