import { Command } from 'commander';
import { convertCommand } from './commands/convert.js';
import { initCommand } from './commands/init.js';
import { watchCommand } from './commands/watch.js';
import { batchCommand } from './commands/batch.js';
import { validateCommand } from './commands/validate.js';
import { explainCommand } from './commands/explain.js';
import { newCommand } from './commands/new.js';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('motarjim')
    .description('Convert HTML/CSS to native UI code')
    .version('0.1.0');

  program
    .command('convert')
    .description('Convert HTML to native UI code')
    .argument('[input]', 'Input HTML file (auto-detected if omitted)')
    .option('-c, --css <path>', 'Input CSS file')
    .option('-t, --target <platform>', 'Target platform: flutter, compose, swiftui')
    .option('-o, --output <path>', 'Output file path')
    .option('--ai-enhance', 'Use Ollama AI for enhanced semantic detection')
    .option('--ai-model <model>', 'Ollama model name (default: qwen2.5:7b)')
    .option('--dry-run', 'Show what would be generated without writing files')
    .action(async (input, opts) => {
      opts.input = input || opts.input;
      opts.args = [input].filter(Boolean);
      await convertCommand(opts as Record<string, unknown>);
    });

  program
    .command('init')
    .description('Create a starter project with sample files and config')
    .action(async () => {
      await initCommand();
    });

  program
    .command('watch')
    .description('Watch HTML/CSS files and auto-regenerate on changes')
    .option('-i, --input <path>', 'Input HTML file')
    .option('-c, --css <path>', 'Input CSS file')
    .option('-t, --target <platform>', 'Target platform: flutter, compose, swiftui')
    .option('-o, --output <path>', 'Output file path')
    .option('--ai-enhance', 'Use Ollama AI for enhanced semantic detection')
    .option('--ai-model <model>', 'Ollama model name')
    .action(async (opts) => {
      await watchCommand(opts as Record<string, unknown>);
    });

  program
    .command('batch')
    .description('Convert all HTML files in a directory')
    .argument('[inputDir]', 'Directory containing HTML files')
    .option('-t, --target <platform>', 'Target platform: flutter, compose, swiftui')
    .option('-o, --output-dir <path>', 'Output directory')
    .option('--ai-enhance', 'Use Ollama AI for enhanced semantic detection')
    .option('--ai-model <model>', 'Ollama model name')
    .action(async (inputDir, opts) => {
      opts.inputDir = inputDir || opts.inputDir;
      await batchCommand(opts as Record<string, unknown>);
    });

  program
    .command('validate')
    .description('Check HTML/CSS for issues before conversion')
    .argument('<input>', 'Input HTML file to validate')
    .option('-c, --css <path>', 'Input CSS file to validate')
    .action(async (input, opts) => {
      opts.input = input;
      await validateCommand(opts as Record<string, unknown>);
    });

  program
    .command('explain')
    .description('Display the compilation pipeline architecture')
    .action(async () => {
      await explainCommand();
    });

  program
    .command('new')
    .description('Scaffold a project from a template')
    .argument('[template]', 'Template name (landing-page, dashboard, ecommerce, portfolio, blog)')
    .action(async (template, opts) => {
      opts.template = template;
      opts.args = [template].filter(Boolean);
      await newCommand(opts as Record<string, unknown>);
    });

  return program;
}
