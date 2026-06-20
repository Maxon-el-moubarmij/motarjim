import type { ValidationIssue } from '../types.js';

const UNSUPPORTED_CSS_PROPERTIES: Record<string, string[]> = {
  'backdrop-filter': ['opacity', 'blur', 'shadow'],
  'animation': ['AnimatedContainer', 'AnimationController'],
  'object-fit': ['BoxFit.cover', 'BoxFit.contain'],
  'position: sticky': ['ScrollView + positioned'],
  'position: fixed': ['Stack + positioned'],
};

const UNSUPPORTED_SELECTORS = [
  ':hover', ':active', ':focus', ':visited',
  ':nth-child', ':nth-of-type', ':first-of-type',
  ':last-of-type', ':empty', ':not', ':has',
  '::before', '::after', '::placeholder',
];

export interface FormattedError {
  title: string;
  details: string[];
  file?: string;
  line?: number;
  col?: number;
  suggestion?: string;
}

export function formatError(error: Error, file?: string, line?: number, col?: number): FormattedError {
  const message = error.message;
  const formatted: FormattedError = {
    title: message,
    details: [],
  };

  if (file) formatted.file = file;
  if (line) formatted.line = line;
  if (col) formatted.col = col;

  for (const [prop, alternatives] of Object.entries(UNSUPPORTED_CSS_PROPERTIES)) {
    if (message.toLowerCase().includes(prop)) {
      formatted.title = `Unsupported CSS property: ${prop}`;
      formatted.details = [
        'Supported alternatives:',
        ...alternatives.map(a => `  • ${a}`),
      ];
      if (file) formatted.details.push(`\nFile: ${file}${line ? `:${line}` : ''}`);
      break;
    }
  }

  if (message.includes('not found')) {
    formatted.title = 'File not found';
    formatted.details = [`The specified file does not exist: ${message.replace('File not found: ', '')}`];
    formatted.suggestion = 'Check that the file path is correct and the file exists.';
  }

  if (message.toLowerCase().includes('unknown target') || message.toLowerCase().includes('target')) {
    formatted.title = 'Invalid target platform';
    formatted.details = [
      `"${message.match(/[""](.+?)[""]/)?.[1] || ''}" is not a valid target.`,
      'Supported targets:',
      '  • flutter   (.dart)',
      '  • compose   (.kt)',
      '  • swiftui   (.swift)',
    ];
  }

  return formatted;
}

export function formatValidationIssues(issues: ValidationIssue[]): string {
  const lines: string[] = [];

  for (const issue of issues) {
    const icon = issue.type === 'error' ? '✖' : issue.type === 'warning' ? '⚠' : 'ℹ';
    const location = issue.file ? `${issue.file}${issue.line ? `:${issue.line}` : ''}` : '';
    const loc = location ? `\n  ${' '.repeat(4)}File: ${location}` : '';
    const sug = issue.suggestion ? `\n  ${' '.repeat(4)}Suggestion: ${issue.suggestion}` : '';

    lines.push(`${icon} ${issue.message}${loc}${sug}`);
  }

  return lines.join('\n');
}

export function displayFormattedError(formatted: FormattedError): void {
  console.error(`\n✖ ${formatted.title}`);
  if (formatted.details.length > 0) {
    for (const detail of formatted.details) {
      console.error(`  ${detail}`);
    }
  }
  if (formatted.suggestion) {
    console.error(`\n  Suggestion: ${formatted.suggestion}`);
  }
  console.error();
}
