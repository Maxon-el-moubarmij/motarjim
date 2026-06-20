import { resolve } from 'path';
import { existsSync } from 'fs';
import chokidar from 'chokidar';
import type { CliConfig, ResolvedOptions } from '../types.js';
import { loadConfigFile, getConfigFromArgs, clearConfigCache } from '../config/loader.js';
import { resolveOptions } from '../config/defaults.js';
import { runPipeline, writeOutput, logStats } from '../services/pipeline.js';

async function getCurrentOptions(args: Record<string, unknown>): Promise<ResolvedOptions> {
  clearConfigCache();
  const cliOpts = getConfigFromArgs(args);
  const configFile = await loadConfigFile();
  return resolveOptions(cliOpts, configFile || undefined);
}

function timestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour12: false });
}

export async function watchCommand(args: Record<string, unknown>): Promise<void> {
  console.log('Starting watch mode...\n');

  let options = await getCurrentOptions(args);

  if (!options.input) {
    console.error('Error: No input file specified. Use --input or configure html-native.config.json');
    process.exit(1);
  }

  const inputPath = resolve(options.input);
  const cssPath = options.css ? resolve(options.css) : undefined;

  if (!existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  const run = async (changeType: string, filePath: string) => {
    console.log(`[${timestamp()}] ${changeType}: ${filePath}`);

    try {
      options = await getCurrentOptions(args);
      const result = await runPipeline(options);

      if (options.output) {
        writeOutput(result.code, options.output);
        console.log(`[${timestamp()}] Generated ${options.target.charAt(0).toUpperCase() + options.target.slice(1)} code successfully`);
      } else {
        console.log(result.code);
      }

      logStats(result.stats);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[${timestamp()}] Error: ${message}`);
    }

    console.log(`[${timestamp()}] Watching for changes...\n`);
  };

  const watcher = chokidar.watch([inputPath], {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 200,
      pollInterval: 100,
    },
  });

  watcher.on('change', (filePath) => {
    run('Changed', filePath);
  });

  if (cssPath && existsSync(cssPath)) {
    watcher.add(cssPath);
  }

  try {
    const result = await runPipeline(options);

    if (options.output) {
      writeOutput(result.code, options.output);
      console.log(`[${timestamp()}] Initial build completed`);
    } else {
      console.log(result.code);
    }

    logStats(result.stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${timestamp()}] Initial build failed: ${message}`);
  }

  console.log(`[${timestamp()}] Watching for changes...`);

  await new Promise<void>((resolve) => {
    process.on('SIGINT', () => {
      console.log('\nWatch mode stopped.');
      watcher.close();
      resolve();
    });
  });
}
