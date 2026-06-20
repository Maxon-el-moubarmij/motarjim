import { describe, it, expect } from 'vitest';
import { getTemplateNames, getTemplate, getAllTemplates } from '../../services/templates.js';

describe('templates', () => {
  it('returns template names', () => {
    const names = getTemplateNames();
    expect(names).toContain('landing-page');
    expect(names).toContain('dashboard');
    expect(names).toContain('ecommerce');
    expect(names).toContain('portfolio');
    expect(names).toContain('blog');
  });

  it('returns a specific template', () => {
    const template = getTemplate('landing-page');
    expect(template).toBeDefined();
    expect(template!.name).toBe('landing-page');
    expect(template!.files).toHaveProperty('designs/index.html');
    expect(template!.files).toHaveProperty('designs/styles.css');
  });

  it('returns undefined for unknown template', () => {
    expect(getTemplate('nonexistent')).toBeUndefined();
  });

  it('returns all templates', () => {
    const all = getAllTemplates();
    expect(all.length).toBe(5);
  });
});
