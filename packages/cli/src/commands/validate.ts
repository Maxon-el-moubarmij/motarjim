import { resolve } from 'path';
import { existsSync } from 'fs';
import { validateInput } from '../services/validate-service.js';
import { formatValidationIssues } from '../services/error-formatter.js';

export async function validateCommand(args: Record<string, unknown>): Promise<void> {
  const inputRaw = (args.input as string) || (args.args as string[])?.[0];
  const cssRaw = args.css as string | undefined;

  if (!inputRaw) {
    console.error('Error: No input file specified. Usage: motarjim validate <file.html> [--css styles.css]');
    process.exit(1);
  }

  const inputPath = resolve(inputRaw);
  const cssPath = cssRaw ? resolve(cssRaw) : undefined;

  if (!existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`Validating: ${inputPath}`);
  if (cssPath) {
    console.log(`CSS file:   ${cssPath}`);
  }
  console.log();

  const result = validateInput(inputPath, cssPath);

  if (result.issues.length === 0) {
    console.log('✓ No issues found. Your HTML/CSS looks good!');
    return;
  }

  const errors = result.issues.filter(i => i.type === 'error');
  const warnings = result.issues.filter(i => i.type === 'warning');
  const infos = result.issues.filter(i => i.type === 'info');

  if (errors.length > 0) {
    console.log(`Errors (${errors.length}):`);
    console.log(formatValidationIssues(errors));
    console.log();
  }

  if (warnings.length > 0) {
    console.log(`Warnings (${warnings.length}):`);
    console.log(formatValidationIssues(warnings));
    console.log();
  }

  if (infos.length > 0) {
    console.log(`Info (${infos.length}):`);
    console.log(formatValidationIssues(infos));
    console.log();
  }

  if (result.valid) {
    console.log('✓ Validation passed (with warnings/info)');
  } else {
    console.log('✖ Validation failed');
    process.exit(1);
  }
}
