#!/usr/bin/env node
import { createProgram } from './src/cli.js';
import { displayFormattedError, formatError } from './src/services/error-formatter.js';

const program = createProgram();

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    const formatted = formatError(error);
    displayFormattedError(formatted);
    process.exit(1);
  }
}

main();
