import { readFileSync, existsSync } from 'fs';
import type { ValidationResult, ValidationIssue } from '../types.js';

const UNSUPPORTED_SELECTORS = [
  ':hover', ':active', ':focus', ':visited', ':link',
  ':nth-child', ':nth-of-type', ':first-of-type', ':last-of-type',
  ':nth-last-child', ':nth-last-of-type', ':first-child', ':last-child',
  ':only-child', ':only-of-type', ':empty', ':not', ':has', ':is', ':where',
  '::before', '::after', '::first-letter', '::first-line',
  '::placeholder', '::selection', '::marker',
];

const UNSUPPORTED_CSS_PROPERTIES = [
  'animation', 'animation-name', 'animation-duration',
  'animation-delay', 'animation-iteration-count',
  'animation-direction', 'animation-timing-function',
  'animation-fill-mode', 'animation-play-state',
  'transition', 'transition-property', 'transition-duration',
  'transition-delay', 'transition-timing-function',
  'transform', 'transform-origin', 'transform-style',
  'perspective', 'perspective-origin', 'backface-visibility',
  'filter', 'backdrop-filter',
  'object-fit', 'object-position',
  'resize', 'cursor', 'caret-color',
  'appearance', '-webkit-appearance', '-moz-appearance',
  'scroll-behavior', 'scroll-snap-type', 'scroll-snap-align',
  'user-select', '-webkit-user-select',
  'pointer-events', 'touch-action',
  'will-change', 'contain',
  'position: sticky', 'position: fixed',
  'overflow: scroll', 'overflow-y: scroll', 'overflow-x: scroll',
  'clip-path', 'mask', 'mask-image',
  'shape-outside', 'shape-margin', 'shape-image-threshold',
];

export function validateHtml(html: string, filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const unclosedTagRegex = /<(\w+)[^>]*>[^<]*<(?!\/\1)/g;
  let match;
  while ((match = unclosedTagRegex.exec(html)) !== null) {
    issues.push({
      type: 'warning',
      message: `Potentially unclosed tag: <${match[1]}>`,
      file: filePath,
      line: html.substring(0, match.index).split('\n').length,
      suggestion: `Ensure <${match[1]}> has a matching </${match[1]}>`,
    });
  }

  const voidElements = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr']);
  const selfClosingRegex = /<(\w+)([^>]*)\/>/g;
  while ((match = selfClosingRegex.exec(html)) !== null) {
    if (!voidElements.has(match[1])) {
      issues.push({
        type: 'info',
        message: `Non-void element self-closed: <${match[1]}/>`,
        file: filePath,
        line: html.substring(0, match.index).split('\n').length,
        suggestion: `Use <${match[1]}></${match[1]}> instead of self-closing syntax`,
      });
    }
  }

  if (!html.toLowerCase().includes('<!doctype html>')) {
    issues.push({
      type: 'info',
      message: 'Missing DOCTYPE declaration',
      file: filePath,
      suggestion: 'Add <!DOCTYPE html> at the top of the file',
    });
  }

  return issues;
}

export function validateCss(css: string, filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const selector of UNSUPPORTED_SELECTORS) {
    const regex = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    let match;
    while ((match = regex.exec(css)) !== null) {
      const line = css.substring(0, match.index).split('\n').length;
      issues.push({
        type: 'warning',
        message: `Unsupported CSS selector: ${selector}`,
        file: filePath,
        line,
        suggestion: `HTML-Native does not support ${selector}. Consider using a class-based approach instead.`,
      });
    }
  }

  for (const prop of UNSUPPORTED_CSS_PROPERTIES) {
    const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'g');
    let match;
    while ((match = regex.exec(css)) !== null) {
      const line = css.substring(0, match.index).split('\n').length;
      issues.push({
        type: 'warning',
        message: `Unsupported CSS property: ${prop}`,
        file: filePath,
        line,
        suggestion: `"${prop}" is not supported for native UI output. Consider using alternatives like opacity, blur, or shadow.`,
      });
    }
  }

  return issues;
}

export function validateInput(inputPath: string, cssPath?: string): ValidationResult {
  const issues: ValidationIssue[] = [];

  if (!existsSync(inputPath)) {
    issues.push({
      type: 'error',
      message: `HTML file not found: ${inputPath}`,
    });
    return { valid: false, issues };
  }

  const html = readFileSync(inputPath, 'utf-8');
  issues.push(...validateHtml(html, inputPath));

  if (cssPath) {
    if (!existsSync(cssPath)) {
      issues.push({
        type: 'error',
        message: `CSS file not found: ${cssPath}`,
      });
    } else {
      const css = readFileSync(cssPath, 'utf-8');
      issues.push(...validateCss(css, cssPath));
    }
  }

  return {
    valid: issues.filter(i => i.type === 'error').length === 0,
    issues,
  };
}
