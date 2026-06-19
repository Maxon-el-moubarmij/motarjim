import { describe, it, expect } from 'vitest';
import { parseHtml } from '../packages/parser/index.js';

describe('Parser', () => {
  it('parses a simple div', () => {
    const ast = parseHtml('<div>Hello</div>');
    expect(ast.tagName).toBe('root');
    expect(ast.children.length).toBeGreaterThan(0);
    expect(ast.children[0].tagName).toBe('div');
  });

  it('parses nested elements', () => {
    const ast = parseHtml('<div><span>text</span></div>');
    const div = ast.children[0];
    expect(div.tagName).toBe('div');
    expect(div.children[0].tagName).toBe('span');
  });

  it('parses attributes', () => {
    const ast = parseHtml('<button class="btn" id="submit">Click</button>');
    const btn = ast.children[0];
    expect(btn.attributes.length).toBeGreaterThanOrEqual(2);
    expect(btn.attributes.find(a => a.name === 'class')?.value).toBe('btn');
    expect(btn.attributes.find(a => a.name === 'id')?.value).toBe('submit');
  });

  it('parses multiple children', () => {
    const ast = parseHtml('<ul><li>A</li><li>B</li><li>C</li></ul>');
    const ul = ast.children[0];
    expect(ul.tagName).toBe('ul');
    expect(ul.children.length).toBe(3);
  });

  it('handles empty input', () => {
    const ast = parseHtml('');
    expect(ast.tagName).toBe('root');
    expect(ast.children.length).toBe(0);
  });

  it('parses all supported tags', () => {
    const tags = ['div', 'span', 'p', 'img', 'button', 'input', 'textarea', 'form',
                   'ul', 'ol', 'li', 'section', 'article', 'header', 'footer', 'nav', 'a', 'svg'];
    const html = tags.map(t => `<${t}></${t}>`).join('\n');
    const ast = parseHtml(`<div>${html}</div>`);
    const container = ast.children[0];
    for (const tag of tags) {
      expect(container.children.some(c => c.tagName === tag)).toBe(true);
    }
  });
});
